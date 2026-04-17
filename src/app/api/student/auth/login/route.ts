import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase";
import { getStudentSession } from "@/lib/session";
import { formatWaNumber, isValidWaNumber } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const { wa_number, session_code, password } = await req.json();

    if (!wa_number || !session_code || !password) {
      return NextResponse.json({ error: "Semua field wajib diisi" }, { status: 400 });
    }

    if (!isValidWaNumber(wa_number)) {
      return NextResponse.json({ error: "Format nomor WhatsApp tidak valid" }, { status: 400 });
    }

    const normalizedWa = formatWaNumber(wa_number);

    // Check rate limit
    const { data: loginAttempt } = await supabaseAdmin
      .from("login_attempts")
      .select("*")
      .eq("wa_number", normalizedWa)
      .eq("session_code", session_code)
      .single();

    if (loginAttempt?.locked_until && new Date(loginAttempt.locked_until) > new Date()) {
      const remaining = Math.ceil((new Date(loginAttempt.locked_until).getTime() - Date.now()) / 60000);
      return NextResponse.json({
        error: `Terlalu banyak percobaan login. Coba lagi dalam ${remaining} menit.`,
        locked: true,
      }, { status: 429 });
    }

    // Find student
    const { data: student } = await supabaseAdmin
      .from("students")
      .select("id")
      .eq("wa_number", normalizedWa)
      .single();

    if (!student) {
      await recordFailedAttempt(normalizedWa, session_code, loginAttempt);
      return NextResponse.json({ error: "Nomor WA atau password salah" }, { status: 401 });
    }

    // Find session
    const { data: session } = await supabaseAdmin
      .from("sessions")
      .select("id, status")
      .eq("code", session_code)
      .single();

    if (!session) {
      await recordFailedAttempt(normalizedWa, session_code, loginAttempt);
      return NextResponse.json({ error: "Kode sesi tidak ditemukan" }, { status: 401 });
    }

    // Find registration
    const { data: registration } = await supabaseAdmin
      .from("registrations")
      .select("id, status, password_hash")
      .eq("student_id", student.id)
      .eq("session_id", session.id)
      .single();

    if (!registration || registration.status !== "approved" || !registration.password_hash) {
      await recordFailedAttempt(normalizedWa, session_code, loginAttempt);
      return NextResponse.json({ error: "Akun belum disetujui atau tidak ditemukan" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, registration.password_hash);
    if (!valid) {
      await recordFailedAttempt(normalizedWa, session_code, loginAttempt);
      return NextResponse.json({ error: "Nomor WA atau password salah" }, { status: 401 });
    }

    // Reset failed attempts
    await supabaseAdmin
      .from("login_attempts")
      .upsert({ wa_number: normalizedWa, session_code, attempt_count: 0, locked_until: null, updated_at: new Date().toISOString() }, { onConflict: "wa_number,session_code" });

    // Check if already submitted
    const { data: attempt } = await supabaseAdmin
      .from("attempts")
      .select("id, submitted_at")
      .eq("registration_id", registration.id)
      .single();

    const studentSession = await getStudentSession();
    studentSession.isLoggedIn = true;
    studentSession.registrationId = registration.id;
    await studentSession.save();

    return NextResponse.json({
      success: true,
      redirect: attempt?.submitted_at ? "/tryout/hasil" : "/tryout",
    });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

async function recordFailedAttempt(
  waNumber: string,
  sessionCode: string,
  existing: { attempt_count: number } | null,
) {
  const newCount = (existing?.attempt_count ?? 0) + 1;
  const lockedUntil = newCount >= 3 ? new Date(Date.now() + 5 * 60 * 1000).toISOString() : null;

  await supabaseAdmin.from("login_attempts").upsert({
    wa_number: waNumber,
    session_code: sessionCode,
    attempt_count: newCount,
    locked_until: lockedUntil,
    updated_at: new Date().toISOString(),
  }, { onConflict: "wa_number,session_code" });
}
