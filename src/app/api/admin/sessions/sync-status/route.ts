import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST() {
  const session = await getAdminSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date().toISOString();

  // Open scheduled sessions that should be open
  await supabaseAdmin
    .from("sessions")
    .update({ status: "open" })
    .eq("open_mode", "scheduled")
    .eq("status", "scheduled")
    .lte("scheduled_open_at", now);

  // Close scheduled sessions that should be closed
  await supabaseAdmin
    .from("sessions")
    .update({ status: "closed" })
    .eq("open_mode", "scheduled")
    .eq("status", "open")
    .lte("scheduled_close_at", now);

  return NextResponse.json({ success: true, synced_at: now });
}
