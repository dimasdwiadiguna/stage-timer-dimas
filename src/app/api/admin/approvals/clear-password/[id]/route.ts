import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabaseAdmin
    .from("registrations")
    .update({ plain_password: null })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
