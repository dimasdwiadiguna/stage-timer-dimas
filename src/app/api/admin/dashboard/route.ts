import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const session = await getAdminSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [sessionsRes, pendingRes, studentsRes] = await Promise.all([
    supabaseAdmin.from("sessions").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("registrations").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabaseAdmin.from("students").select("id", { count: "exact", head: true }),
  ]);

  return NextResponse.json({
    totalSessions: sessionsRes.count ?? 0,
    totalPending: pendingRes.count ?? 0,
    totalStudents: studentsRes.count ?? 0,
  });
}
