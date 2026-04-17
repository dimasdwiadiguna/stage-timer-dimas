import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";

interface RegistrationWithStudent {
  student_id: string;
  session_id: string;
  students: { name: string; wa_number: string };
}

export async function GET(_req: NextRequest, { params }: { params: { sessionId: string } }) {
  const session = await getAdminSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessionId = params.sessionId;

  const { data: sessionData } = await supabaseAdmin
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (!sessionData) return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 404 });

  const { data: attempts } = await supabaseAdmin
    .from("attempts")
    .select(`
      id, started_at, submitted_at, score, total_questions,
      registrations!inner(
        student_id,
        session_id,
        students(name, wa_number)
      )
    `)
    .eq("registrations.session_id", sessionId)
    .not("submitted_at", "is", null);

  const { data: questions } = await supabaseAdmin
    .from("questions")
    .select("id, order_index, question_text")
    .eq("session_id", sessionId)
    .order("order_index");

  const attemptIds = (attempts || []).map((a) => a.id);
  const answerStats: Record<string, { correct: number; total: number }> = {};

  if (attemptIds.length > 0) {
    const { data: answers } = await supabaseAdmin
      .from("answers")
      .select("question_id, is_correct")
      .in("attempt_id", attemptIds);

    (answers || []).forEach((a) => {
      if (!answerStats[a.question_id]) answerStats[a.question_id] = { correct: 0, total: 0 };
      answerStats[a.question_id].total++;
      if (a.is_correct) answerStats[a.question_id].correct++;
    });
  }

  const scores = (attempts || []).map((a) => a.score ?? 0);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  const questionStats = (questions || []).map((q) => {
    const stats = answerStats[q.id] || { correct: 0, total: 0 };
    return {
      ...q,
      correct_count: stats.correct,
      total_answers: stats.total,
      percent_correct: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
    };
  }).sort((a, b) => a.percent_correct - b.percent_correct);

  return NextResponse.json({
    session: sessionData,
    summary: {
      total_participants: attempts?.length ?? 0,
      avg_score: avgScore,
      max_score: scores.length > 0 ? Math.max(...scores) : 0,
      min_score: scores.length > 0 ? Math.min(...scores) : 0,
    },
    attempts: (attempts || []).map((a) => {
      const reg = a.registrations as unknown as RegistrationWithStudent;
      return {
        id: a.id,
        student_name: reg?.students?.name,
        student_wa: reg?.students?.wa_number,
        score: a.score,
        total_questions: a.total_questions,
        started_at: a.started_at,
        submitted_at: a.submitted_at,
      };
    }),
    question_stats: questionStats,
  });
}
