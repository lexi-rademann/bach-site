import { NextResponse } from "next/server";

const COOKIE_NAME = "bach_access";

export async function POST(req: Request) {
  const url = new URL("/unlock", req.url);

  // 303 makes the browser follow the redirect with a GET (better after a POST)
  const res = NextResponse.redirect(url, 303);

  // Clear the cookie
  res.cookies.set({
    name: COOKIE_NAME,
    value: "",
    path: "/",
    maxAge: 0,
  });

  return res;
}
