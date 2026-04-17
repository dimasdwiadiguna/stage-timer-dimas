import { NextRequest, NextResponse } from "next/server";
import { getStudentSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const session = await getStudentSession();
  if (!session.isLoggedIn || !session.registrationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { question_id, chosen_option } = await req.json();
  if (!question_id || !chosen_option) {
    return NextResponse.json({ error: "question_id dan chosen_option wajib diisi" }, { status: 400 });
  }

  if (!["A", "B", "C", "D", "E"].includes(chosen_option)) {
    return NextResponse.json({ error: "Opsi tidak valid" }, { status: 400 });
  }

  const { data: attempt } = await supabaseAdmin
    .from("attempts")
    .select("id, submitted_at")
    .eq("registration_id", session.registrationId)
    .single();

  if (!attempt) return NextResponse.json({ error: "Attempt tidak ditemukan" }, { status: 404 });
  if (attempt.submitted_at) return NextResponse.json({ error: "Ujian sudah selesai" }, { status: 400 });

  const { error } = await supabaseAdmin.from("answers").upsert({
    attempt_id: attempt.id,
    question_id,
    chosen_option,
    is_correct: null,
  }, { onConflict: "attempt_id,question_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
