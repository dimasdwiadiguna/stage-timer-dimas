import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const session = await getStudentSession();
  if (!session.isLoggedIn || !session.registrationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: attempt } = await supabaseAdmin
    .from("attempts")
    .select("id")
    .eq("registration_id", session.registrationId)
    .single();

  if (!attempt) return NextResponse.json([]);

  const { data: answers } = await supabaseAdmin
    .from("answers")
    .select("question_id, chosen_option, is_correct")
    .eq("attempt_id", attempt.id);

  return NextResponse.json(answers || []);
}
