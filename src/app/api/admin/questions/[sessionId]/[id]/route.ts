import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import { sanitizeText } from "@/lib/utils";

export async function PUT(req: NextRequest, { params }: { params: { sessionId: string; id: string } }) {
  const session = await getAdminSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { question_text, option_a, option_b, option_c, option_d, option_e, correct_option, order_index } = body;

  const { data, error } = await supabaseAdmin
    .from("questions")
    .update({
      question_text: sanitizeText(question_text),
      option_a: sanitizeText(option_a),
      option_b: sanitizeText(option_b),
      option_c: sanitizeText(option_c),
      option_d: sanitizeText(option_d),
      option_e: option_e ? sanitizeText(option_e) : null,
      correct_option: correct_option.toUpperCase(),
      order_index: parseInt(order_index),
    })
    .eq("id", params.id)
    .eq("session_id", params.sessionId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: { sessionId: string; id: string } }) {
  const session = await getAdminSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabaseAdmin
    .from("questions")
    .delete()
    .eq("id", params.id)
    .eq("session_id", params.sessionId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
