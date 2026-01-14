import { NextResponse } from "next/server";
import crypto from "crypto";

const COOKIE_NAME = "bach_access";

function safeEqual(a: string, b: string) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const passcode = body?.passcode ?? "";

  const expected = process.env.EVENT_PASSCODE ?? "";

  if (!passcode || !expected || !safeEqual(passcode, expected)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });

  res.cookies.set({
    name: COOKIE_NAME,
    value: "1",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14, // 14 days
  });

  return res;
}
