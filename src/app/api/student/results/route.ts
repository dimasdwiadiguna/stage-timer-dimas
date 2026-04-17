import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";

interface QuestionResult {
  order_index: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  option_e: string | null;
  correct_option: string;
}

export async function GET() {
  const session = await getStudentSession();
  if (!session.isLoggedIn || !session.registrationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: attempt } = await supabaseAdmin
    .from("attempts")
    .select("id, score, total_questions, submitted_at")
    .eq("registration_id", session.registrationId)
    .single();

  if (!attempt?.submitted_at) {
    return NextResponse.json({ error: "Ujian belum selesai" }, { status: 400 });
  }

  const { data: answers } = await supabaseAdmin
    .from("answers")
    .select(`
      chosen_option,
      is_correct,
      questions(order_index, question_text, option_a, option_b, option_c, option_d, option_e, correct_option)
    `)
    .eq("attempt_id", attempt.id)
    .order("questions(order_index)");

  const wrongAnswers = (answers || [])
    .filter((a) => a.is_correct === false && a.chosen_option !== null)
    .map((a) => {
      const q = a.questions as unknown as QuestionResult;
      const optionMap: Record<string, string> = {
        A: q?.option_a,
        B: q?.option_b,
        C: q?.option_c,
        D: q?.option_d,
        E: q?.option_e ?? "",
      };
      return {
        order_index: q?.order_index,
        question_text: q?.question_text,
        chosen_option: a.chosen_option,
        chosen_text: optionMap[a.chosen_option ?? ""] ?? "-",
        correct_option: q?.correct_option,
        correct_text: optionMap[q?.correct_option ?? ""] ?? "-",
      };
    });

  const notAnswered = (answers || []).filter((a) => a.chosen_option === null).length;

  return NextResponse.json({
    score: attempt.score,
    total_questions: attempt.total_questions,
    correct: attempt.score,
    wrong: (attempt.total_questions ?? 0) - (attempt.score ?? 0) - notAnswered,
    not_answered: notAnswered,
    wrong_answers: wrongAnswers,
  });
}
