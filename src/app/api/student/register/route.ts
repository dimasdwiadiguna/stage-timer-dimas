import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { formatWaNumber, isValidWaNumber, sanitizeText } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, wa_number, session_code } = body;

    if (!name || !wa_number || !session_code) {
      return NextResponse.json({ error: "Semua field wajib diisi" }, { status: 400 });
    }

    if (!isValidWaNumber(wa_number)) {
      return NextResponse.json({ error: "Format nomor WhatsApp tidak valid" }, { status: 400 });
    }

    if (!/^\d{6}$/.test(session_code)) {
      return NextResponse.json({ error: "Kode sesi harus 6 digit angka" }, { status: 400 });
    }

    // Check session exists and is open
    const { data: session } = await supabaseAdmin
      .from("sessions")
      .select("id, name, status")
      .eq("code", session_code)
      .single();

    if (!session) {
      return NextResponse.json({ error: "Kode sesi tidak ditemukan" }, { status: 404 });
    }

    if (session.status === "closed") {
      return NextResponse.json({ error: "Sesi ini sudah ditutup dan tidak menerima pendaftaran baru" }, { status: 400 });
    }

    const normalizedWa = formatWaNumber(wa_number);

    // Find or create student
    let studentId: string;
    const { data: existingStudent } = await supabaseAdmin
      .from("students")
      .select("id")
      .eq("wa_number", normalizedWa)
      .single();

    if (existingStudent) {
      studentId = existingStudent.id;
    } else {
      const { data: newStudent, error: createErr } = await supabaseAdmin
        .from("students")
        .insert({ name: sanitizeText(name), wa_number: normalizedWa })
        .select()
        .single();
      if (createErr) return NextResponse.json({ error: "Gagal membuat akun siswa" }, { status: 500 });
      studentId = newStudent.id;
    }

    // Check existing registration
    const { data: existingReg } = await supabaseAdmin
      .from("registrations")
      .select("id, status")
      .eq("student_id", studentId)
      .eq("session_id", session.id)
      .single();

    if (existingReg) {
      if (existingReg.status === "rejected") {
        return NextResponse.json({ error: "Pendaftaran Anda sebelumnya telah ditolak oleh admin" }, { status: 400 });
      }
      return NextResponse.json({ error: "Anda sudah terdaftar untuk sesi ini" }, { status: 409 });
    }

    const { error: regError } = await supabaseAdmin.from("registrations").insert({
      student_id: studentId,
      session_id: session.id,
      status: "pending",
    });

    if (regError) return NextResponse.json({ error: "Gagal mendaftar" }, { status: 500 });

    return NextResponse.json({
      success: true,
      student_name: sanitizeText(name),
      wa_number: normalizedWa,
      session_name: session.name,
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
