import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface AdminSessionData {
  isLoggedIn: boolean;
  username?: string;
}

export interface StudentSessionData {
  isLoggedIn: boolean;
  registrationId?: string;
}

const sessionSecret = process.env.SESSION_SECRET!;

export const adminSessionOptions: SessionOptions = {
  password: sessionSecret,
  cookieName: "admin_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  },
};

export const studentSessionOptions: SessionOptions = {
  password: sessionSecret,
  cookieName: "student_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  },
};

export async function getAdminSession() {
  const cookieStore = await cookies();
  return getIronSession<AdminSessionData>(cookieStore, adminSessionOptions);
}

export async function getStudentSession() {
  const cookieStore = await cookies();
  return getIronSession<StudentSessionData>(cookieStore, studentSessionOptions);
}
