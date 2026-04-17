import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { adminSessionOptions, AdminSessionData } from "@/lib/session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    // iron-session needs a writable cookie store; in middleware we only read
    const cookieStore = {
      get: (name: string) => req.cookies.get(name),
      set: () => { /* read-only in middleware */ },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await getIronSession<AdminSessionData>(cookieStore as any, adminSessionOptions);
    if (!session.isLoggedIn) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
