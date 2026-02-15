import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { topic, course = "IB" } = await req.json();

    // 1. Review Mechanism (10% chance)
    // Try to pick a question from history to reinforce learning
    const shouldReview = Math.random() < 0.10; // 10% probability

    if (shouldReview) {
      console.log(`Attempting to review existing question for topic: ${topic}`);
      
      // Fetch up to 50 recent questions for this topic to pick from
      const { data: existingQuestions, error: fetchError } = await supabaseAdmin
        .from('questions')
        .select('*')
        .eq('topic', topic)
        .eq('course', course) // Filter by course as well
        .limit(50);

      if (!fetchError && existingQuestions && existingQuestions.length > 0) {
        // Pick one randomly
        const randomIndex = Math.floor(Math.random() * existingQuestions.length);
        const reviewQuestion = existingQuestions[randomIndex];
        
        console.log(`Reviewing question ID: ${reviewQuestion.id}`);
        return NextResponse.json(reviewQuestion);
      }
      console.log("No existing questions found for review, falling back to AI.");
    }

    // 2. AI Generation (Standard path)
    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json({ error: "Missing API Key" }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let systemInstruction = "";
    if (course === "SAT") {
      systemInstruction = `
      Act as an expert SAT Tutor (Digital SAT format).
      Generate a practice question for the topic: "${topic}".
      
      If the topic is related to MATH (Algebra, Data Analysis, etc.):
      - Generate a standard multiple-choice or student-produced response question.
      - Difficulty: Module 1 or 2 level.
      
      If the topic is related to READING & WRITING (Craft & Structure, Grammar, etc.):
      - Generate a standard passage-based question (approx 50-150 words passage).
      - Include the passage in the [QUESTION] block.
      - Ensure it tests the specific skill (e.g., words in context, transitions, punctuation).
      - Provide 4 distinct options (A, B, C, D) in the question text.
      `;
    } else {
      systemInstruction = `
      Act as an expert IB Math AA SL teacher.
      Generate a standard exam-style practice question for: "${topic}".
      The difficulty should be appropriate for IB Math AA SL (Level 4-6).
      `;
    }

    const prompt = `
      ${systemInstruction}
      
      Output format (STRICTLY follow this, do not use JSON):
      
      [QUESTION]
      Write the full question text here. Use $...$ for inline math.
      
      [HINT]
      Write a helpful hint that nudges the student in the right direction without giving away the answer.
      
      [ANSWER]
      Write the final short answer here (e.g. "x = 5").
      
      [EXPLANATION]
      Write the detailed step-by-step solution here. Use LaTeX freely.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Manual Parsing
    const questionMatch = text.match(/\[QUESTION\]([\s\S]*?)\[HINT\]/);
    const hintMatch = text.match(/\[HINT\]([\s\S]*?)\[ANSWER\]/);
    const answerMatch = text.match(/\[ANSWER\]([\s\S]*?)\[EXPLANATION\]/);
    const explanationMatch = text.match(/\[EXPLANATION\]([\s\S]*)/);

    if (!questionMatch || !hintMatch || !answerMatch || !explanationMatch) {
      throw new Error("Failed to parse output format");
    }

    const questionData = {
      topic: topic,
      course: course, // Save course info
      question_text: questionMatch[1].trim(),
      hint: hintMatch[1].trim(),
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
