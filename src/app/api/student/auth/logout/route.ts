import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/session";

export async function POST() {
  const session = await getStudentSession();
  session.destroy();
  return NextResponse.json({ success: true });
}
