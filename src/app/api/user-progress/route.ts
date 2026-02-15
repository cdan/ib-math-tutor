import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const course = searchParams.get("course") || "IB"; // Default to IB

  console.log("Fetching progress for:", userId, course);

  if (!userId) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 });
  }

  try {
    // 1. Fetch Mastery (filtered by course if column exists, otherwise filter by topic prefix/suffix in memory)
    // Ideally, add 'course' column to user_mastery table.
    const { data: masteryData, error: masteryError } = await supabaseAdmin
      .from('user_mastery')
      .select('topic, correct_count, total_attempts, course') // Select course if available
      .eq('user_id', userId)
      .eq('course', course); // Filter by course directly if column exists

    if (masteryError) {
        console.error("Mastery Fetch Error:", masteryError);
        // Fallback: If column doesn't exist, we might get all mastery data.
        // We can filter by syllabus topics in memory if needed.
    }

    const mastery: Record<string, { correct: number; total: number }> = {};
    if (masteryData) {
        masteryData.forEach((item: any) => {
            // Only include if course matches or if column missing (fallback)
            if (!item.course || item.course === course) {
                mastery[item.topic] = {
                    correct: item.correct_count,
                    total: item.total_attempts
                };
            }
        });
    }

    // 2. Fetch History (Attempts with Question details)
    // Use inner join to filter attempts by question course
    const { data: historyData, error: historyError } = await supabaseAdmin
      .from('attempts')
      .select(`
        id,
        created_at,
        user_answer,
        is_correct,
        feedback,
        question:questions!inner (
          id,
          topic,
          question_text,
          correct_answer,
          explanation,
          course
        )
      `)
      .eq('user_id', userId)
      .eq('questions.course', course) // Filter by joined table
      .order('created_at', { ascending: false })
      .limit(1000); 

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
