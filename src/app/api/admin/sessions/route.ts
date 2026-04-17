import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import { generateSessionCode, sanitizeText } from "@/lib/utils";

export async function GET() {
  const session = await getAdminSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("sessions")
    .select(`
      *,
      registrations(count)
    `)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const sessions = data.map((s) => ({
    ...s,
    studentCount: s.registrations?.[0]?.count ?? 0,
  }));

  return NextResponse.json(sessions);
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, duration_minutes, open_mode, scheduled_open_at, scheduled_close_at } = body;

  if (!name || !duration_minutes) {
    return NextResponse.json({ error: "Nama dan durasi wajib diisi" }, { status: 400 });
  }

  if (open_mode === "scheduled" && (!scheduled_open_at || !scheduled_close_at)) {
    return NextResponse.json({ error: "Waktu buka dan tutup wajib diisi untuk mode terjadwal" }, { status: 400 });
  }

  // Generate unique 6-digit code
  let code = "";
  let attempts = 0;
  while (attempts < 10) {
    const candidate = generateSessionCode();
    const { data } = await supabaseAdmin.from("sessions").select("id").eq("code", candidate).single();
    if (!data) { code = candidate; break; }
    attempts++;
  }

  if (!code) return NextResponse.json({ error: "Gagal membuat kode sesi unik" }, { status: 500 });

  const { data, error } = await supabaseAdmin.from("sessions").insert({
    name: sanitizeText(name),
    code,
    duration_minutes: parseInt(duration_minutes),
    open_mode: open_mode || "manual",
    status: open_mode === "scheduled" ? "scheduled" : "draft",
    scheduled_open_at: scheduled_open_at || null,
    scheduled_close_at: scheduled_close_at || null,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
