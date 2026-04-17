import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import { sanitizeText } from "@/lib/utils";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("sessions")
    .select("*, registrations(count), questions(count)")
    .eq("id", params.id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ...data,
    studentCount: (data.registrations as unknown as { count: number }[])?.[0]?.count ?? 0,
    questionCount: (data.questions as unknown as { count: number }[])?.[0]?.count ?? 0,
  });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, duration_minutes, open_mode, scheduled_open_at, scheduled_close_at, instruction_text, closing_text } = body;

  if (!name || !duration_minutes) {
    return NextResponse.json({ error: "Nama dan durasi wajib diisi" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("sessions")
    .update({
      name: sanitizeText(name),
      duration_minutes: parseInt(duration_minutes),
      open_mode: open_mode || "manual",
      scheduled_open_at: scheduled_open_at || null,
      scheduled_close_at: scheduled_close_at || null,
      instruction_text: instruction_text || null,
      closing_text: closing_text || null,
    })
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabaseAdmin.from("sessions").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
