import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST() {
  const session = await getStudentSession();
  if (!session.isLoggedIn || !session.registrationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get attempt
  const { data: attempt } = await supabaseAdmin
    .from("attempts")
    .select("id, submitted_at")
    .eq("registration_id", session.registrationId)
    .single();

  if (!attempt) return NextResponse.json({ error: "Attempt tidak ditemukan" }, { status: 404 });
  if (attempt.submitted_at) return NextResponse.json({ error: "Sudah dikumpulkan" }, { status: 400 });

  // Get all questions for this session
  const { data: registration } = await supabaseAdmin
    .from("registrations")
    .select("session_id")
    .eq("id", session.registrationId)
    .single();

  const { data: questions } = await supabaseAdmin
    .from("questions")
    .select("id, correct_option")
    .eq("session_id", registration!.session_id);

  const totalQuestions = questions?.length ?? 0;

  // Get all answers for this attempt
  const { data: answers } = await supabaseAdmin
    .from("answers")
    .select("question_id, chosen_option")
    .eq("attempt_id", attempt.id);

  // Score calculation
  let correctCount = 0;
  const answerMap = new Map((answers || []).map((a) => [a.question_id, a.chosen_option]));

  const answerUpdates = (questions || []).map((q) => {
    const chosen = answerMap.get(q.id) || null;
    const isCorrect = chosen ? chosen === q.correct_option : false;
    if (isCorrect) correctCount++;
    return {
      attempt_id: attempt.id,
      question_id: q.id,
      chosen_option: chosen,
      is_correct: isCorrect,
    };
  });

  // Upsert all answers with correctness
  if (answerUpdates.length > 0) {
    await supabaseAdmin.from("answers").upsert(answerUpdates, { onConflict: "attempt_id,question_id" });
  }

  // Update attempt
  const { data: updated, error } = await supabaseAdmin
    .from("attempts")
    .update({
      submitted_at: new Date().toISOString(),
      score: correctCount,
      total_questions: totalQuestions,
    })
    .eq("id", attempt.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(updated);
}
