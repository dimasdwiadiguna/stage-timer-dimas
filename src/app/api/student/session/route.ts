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
    .select(`
      id,
      students(id, name, wa_number),
      sessions(id, name, code, status, duration_minutes, scheduled_open_at, scheduled_close_at)
    `)
    .eq("id", session.registrationId)
    .single();

  if (!registration) {
    return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
  }

  const { data: attempt } = await supabaseAdmin
    .from("attempts")
    .select("id, started_at, submitted_at, score, total_questions")
    .eq("registration_id", session.registrationId)
    .single();

  return NextResponse.json({ registration, attempt: attempt || null });
}
