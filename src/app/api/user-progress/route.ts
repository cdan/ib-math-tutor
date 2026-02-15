import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  console.log("Fetching progress for:", userId);

  if (!userId) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 });
  }

  try {
    // 1. Fetch Mastery
    const { data: masteryData, error: masteryError } = await supabaseAdmin
      .from('user_mastery')
      .select('topic, correct_count, total_attempts')
      .eq('user_id', userId);

    if (masteryError) {
        console.error("Mastery Fetch Error:", masteryError);
    }

    const mastery: Record<string, { correct: number; total: number }> = {};
    if (masteryData) {
        masteryData.forEach((item: any) => {
            mastery[item.topic] = {
                correct: item.correct_count,
                total: item.total_attempts
            };
        });
    }

    // 2. Fetch History (Attempts with Question details)
    const { data: historyData, error: historyError } = await supabaseAdmin
      .from('attempts')
      .select(`
        id,
        created_at,
        user_answer,
        is_correct,
        feedback,
        question:questions (
          id,
          topic,
          question_text,
          correct_answer,
          explanation
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1000); // Increased limit for calendar view

    if (historyError) {
        console.error("History Fetch Error:", historyError);
    }

    // Transform to frontend format: HistoryItem[]
    const history = historyData?.map((item: any) => {
      const q = item.question; // joined data
      return {
        id: item.id,
        timestamp: new Date(item.created_at).getTime(),
        topic: q?.topic || "Unknown",
        questionText: q?.question_text || "Question unavailable (Deleted or temp)",
        userAnswer: item.user_answer,
        correctAnswer: q?.correct_answer || "?",
        explanation: q?.explanation || item.feedback || "",
        isCorrect: item.is_correct
      };
    }) || [];



    return NextResponse.json({ mastery, history });

  } catch (error: any) {
    console.error("Fetch Progress Error:", error);
    return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 });
  }
}
