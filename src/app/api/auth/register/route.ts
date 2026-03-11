// This route has been moved to /api/register to avoid conflicts
// with NextAuth's [...nextauth] catch-all handler.
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.redirect(new URL("/api/register", process.env.NEXTAUTH_URL ?? "http://localhost:3000"));
}
