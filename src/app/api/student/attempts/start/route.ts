import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST() {
  const session = await getStudentSession();
  if (!session.isLoggedIn || !session.registrationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check session status
  const { data: registration } = await supabaseAdmin
    .from("registrations")
    .select("session_id, sessions(status, duration_minutes)")
    .eq("id", session.registrationId)
    .single();

  const examSession = registration?.sessions as unknown as { status: string; duration_minutes: number } | null;
  if (!examSession || examSession.status !== "open") {
    return NextResponse.json({ error: "Sesi tidak dalam status terbuka" }, { status: 400 });
  }

  // Check if attempt already exists
  const { data: existing } = await supabaseAdmin
    .from("attempts")
    .select("id, started_at, submitted_at")
    .eq("registration_id", session.registrationId)
    .single();

  if (existing?.submitted_at) {
    return NextResponse.json({ error: "Ujian sudah selesai" }, { status: 400 });
  }

  if (existing?.started_at) {
    return NextResponse.json(existing);
  }

  const { data: attempt, error } = await supabaseAdmin
    .from("attempts")
    .insert({
      registration_id: session.registrationId,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(attempt, { status: 201 });
}
