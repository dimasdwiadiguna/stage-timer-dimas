import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const session = await getStudentSession();
  if (!session.isLoggedIn || !session.registrationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: registration } = await supabaseAdmin
    .from("registrations")
    .select("session_id")
    .eq("id", session.registrationId)
    .single();

  if (!registration) return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });

  const { data: questions } = await supabaseAdmin
    .from("questions")
    .select("id, order_index, question_text, option_a, option_b, option_c, option_d, option_e")
    .eq("session_id", registration.session_id)
    .order("order_index");

  return NextResponse.json(questions || []);
}
