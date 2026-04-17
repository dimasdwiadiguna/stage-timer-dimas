import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getAdminSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username dan password wajib diisi" }, { status: 400 });
    }

    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

    if (!adminUsername || !adminPasswordHash) {
      return NextResponse.json({ error: "Konfigurasi admin tidak lengkap" }, { status: 500 });
    }

    if (username !== adminUsername) {
      return NextResponse.json({ error: "Username atau password salah" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, adminPasswordHash);
    if (!valid) {
      return NextResponse.json({ error: "Username atau password salah" }, { status: 401 });
    }

    const session = await getAdminSession();
    session.isLoggedIn = true;
    session.username = username;
    await session.save();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
