import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getAdminSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import { generatePassword } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { registration_id } = await req.json();
  if (!registration_id) return NextResponse.json({ error: "registration_id wajib diisi" }, { status: 400 });

  const plainPassword = generatePassword();
  const passwordHash = await bcrypt.hash(plainPassword, 10);

  const { data, error } = await supabaseAdmin
    .from("registrations")
    .update({
      status: "approved",
      password_hash: passwordHash,
      plain_password: plainPassword,
      approved_at: new Date().toISOString(),
      rejection_reason: null,
    })
    .eq("id", registration_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ...data, plain_password: plainPassword });
}
