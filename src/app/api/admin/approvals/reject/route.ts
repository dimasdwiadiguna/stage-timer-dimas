import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import { sanitizeText } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { registration_id, reason } = await req.json();
  if (!registration_id) return NextResponse.json({ error: "registration_id wajib diisi" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("registrations")
    .update({
      status: "rejected",
      rejection_reason: reason ? sanitizeText(reason) : null,
      password_hash: null,
      plain_password: null,
    })
    .eq("id", registration_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
