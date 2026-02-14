import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { topic } = await req.json();

    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json({ error: "Missing API Key" }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      Act as an expert IB Math AA SL teacher.
      Generate a CHALLENGING (Level 6-7) practice question for: "${topic}".
      
      Output format (STRICTLY follow this, do not use JSON):
      
      [QUESTION]
      Write the full question text here. Use $...$ for inline math.
      
      [ANSWER]
      Write the final short answer here (e.g. "x = 5").
      
      [EXPLANATION]
      Write the detailed step-by-step solution here. Use LaTeX freely.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Manual Parsing
    const questionMatch = text.match(/\[QUESTION\]([\s\S]*?)\[ANSWER\]/);
    const answerMatch = text.match(/\[ANSWER\]([\s\S]*?)\[EXPLANATION\]/);
    const explanationMatch = text.match(/\[EXPLANATION\]([\s\S]*)/);

    if (!questionMatch || !answerMatch || !explanationMatch) {
      throw new Error("Failed to parse output format");
    }

    const questionData = {
      topic: topic,
      question_text: questionMatch[1].trim(),
      correct_answer: answerMatch[1].trim(),
      explanation: explanationMatch[1].trim(),
    };

    // Save to Database
    const { data, error } = await supabaseAdmin
      .from('questions')
      .insert([questionData])
      .select()
      .single();

    if (error) {
      console.error("DB Insert Error:", error);
      // Fallback: Return without saving if DB fails, but warn
      return NextResponse.json({ ...questionData, id: "temp-" + Date.now() });
    }

    return NextResponse.json(data); // Returns object with 'id' from DB

  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return NextResponse.json(
      { error: "Generation failed", details: error.message },
      { status: 500 }
    );
  }
}
