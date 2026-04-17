import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: currentSession, error: fetchError } = await supabaseAdmin
    .from("sessions")
    .select("status, open_mode")
    .eq("id", params.id)
    .single();

  if (fetchError || !currentSession) {
    return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 404 });
  }

  if (currentSession.open_mode !== "manual") {
    return NextResponse.json({ error: "Hanya sesi manual yang bisa di-toggle" }, { status: 400 });
  }

  const newStatus = currentSession.status === "open" ? "closed" : "open";

  const { data, error } = await supabaseAdmin
    .from("sessions")
    .update({ status: newStatus })
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
