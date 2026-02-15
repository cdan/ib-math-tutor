import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { question, userAnswer, topic, questionId, userId, course = "IB", forceIncorrect } = await req.json();

    let status = "incorrect";
    let feedback = "";
    let isCorrect = false;

    if (forceIncorrect) {
      status = "surrendered";
      feedback = "Solution revealed.";
    } else {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `
        You are grading an IB Math AA SL answer.
        Question: "${question}"
        Student Answer: "${userAnswer}"
        
        Output format (STRICTLY follow this):
        
        [STATUS]
        CORRECT or INCORRECT or PARTIAL
        
        [FEEDBACK]
        Write your feedback here. Use LaTeX freely.
      `;

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      const statusMatch = text.match(/\[STATUS\]\s*(CORRECT|INCORRECT|PARTIAL)/i);
      const feedbackMatch = text.match(/\[FEEDBACK\]([\s\S]*)/);

      if (!statusMatch || !feedbackMatch) {
        throw new Error("Failed to parse evaluation format");
      }

      status = statusMatch[1].toLowerCase();
      isCorrect = status === "correct";
      feedback = feedbackMatch[1].trim();
    }

    // DB Operations (Fire and Forget)

    console.log("Evaluate DB Attempt START:", { userId, questionId, isCorrect });

    if (userId && questionId && !questionId.startsWith("temp-")) {
      const attemptPayload = {
        user_id: userId,
        question_id: questionId,
        user_answer: userAnswer,
        is_correct: isCorrect,
        feedback: feedback
      };
      
      const { data: attemptData, error: attemptError } = await supabaseAdmin
        .from('attempts')
        .insert(attemptPayload)
        .select();

      if (attemptError) {
        console.error("Attempt Insert Error:", attemptError);
      } else {
        console.log("Attempt Insert Success:", attemptData);
      }

      // Update Mastery (Upsert)
      const { data: current, error: fetchError } = await supabaseAdmin
        .from('user_mastery')
        .select('*')
        .eq('user_id', userId)
        .eq('topic', topic)
        .eq('course', course)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') { // Ignore "no rows" error
          console.error("Mastery Fetch Error:", fetchError);
      }

      const newCorrect = (current?.correct_count || 0) + (isCorrect ? 1 : 0);
      const newTotal = (current?.total_attempts || 0) + 1;

      const { error: upsertError } = await supabaseAdmin.from('user_mastery').upsert({
        user_id: userId,
        topic: topic,
        course: course,
        correct_count: newCorrect,
        total_attempts: newTotal,
        last_practiced_at: new Date().toISOString()
      }, { onConflict: 'user_id, topic, course' });

      if (upsertError) console.error("Mastery Upsert Error:", upsertError);
    } else {
        console.log("Skipping DB save: Invalid userId or temp questionId", { userId, questionId });
    }


    return NextResponse.json({
      status: status,
      feedback: feedback
    });

  } catch (error: any) {
    console.error("AI Evaluation Error:", error);
    return NextResponse.json({ error: "Evaluation failed" }, { status: 500 });
  }
}
