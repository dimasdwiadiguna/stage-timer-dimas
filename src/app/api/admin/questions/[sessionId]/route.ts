import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import { sanitizeText } from "@/lib/utils";

export async function GET(_req: NextRequest, { params }: { params: { sessionId: string } }) {
  const session = await getAdminSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("questions")
    .select("*")
    .eq("session_id", params.sessionId)
    .order("order_index");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest, { params }: { params: { sessionId: string } }) {
  const session = await getAdminSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // Bulk import support
  if (Array.isArray(body)) {
    const rows = body.map((q) => ({
      session_id: params.sessionId,
      order_index: parseInt(q.order_index),
      question_text: sanitizeText(q.question_text),
      option_a: sanitizeText(q.option_a),
      option_b: sanitizeText(q.option_b),
      option_c: sanitizeText(q.option_c),
      option_d: sanitizeText(q.option_d),
      option_e: q.option_e ? sanitizeText(q.option_e) : null,
      correct_option: q.correct_option.toUpperCase(),
    }));

    const { data, error } = await supabaseAdmin.from("questions").insert(rows).select();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  }

  // Single question
  const { question_text, option_a, option_b, option_c, option_d, option_e, correct_option, order_index } = body;

  if (!question_text || !option_a || !option_b || !option_c || !option_d || !correct_option) {
    return NextResponse.json({ error: "Field wajib tidak lengkap" }, { status: 400 });
  }

  // Get next order_index if not provided
  let idx = order_index;
  if (!idx) {
    const { data: existing } = await supabaseAdmin
      .from("questions")
      .select("order_index")
      .eq("session_id", params.sessionId)
      .order("order_index", { ascending: false })
      .limit(1);
    idx = existing?.[0]?.order_index ? existing[0].order_index + 1 : 1;
  }

  const { data, error } = await supabaseAdmin.from("questions").insert({
    session_id: params.sessionId,
    order_index: parseInt(idx),
    question_text: sanitizeText(question_text),
    option_a: sanitizeText(option_a),
    option_b: sanitizeText(option_b),
    option_c: sanitizeText(option_c),
    option_d: sanitizeText(option_d),
    option_e: option_e ? sanitizeText(option_e) : null,
    correct_option: correct_option.toUpperCase(),
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
