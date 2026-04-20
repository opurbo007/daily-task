import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export const runtime = "experimental-edge";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/api/auth",
  "/api/register",
  "/api/debug",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public routes
  const isPublic = PUBLIC_PATHS.some((path) =>
    pathname.startsWith(path)
  );

  if (isPublic) {
    return NextResponse.next();
  }

  const secret = process.env.NEXTAUTH_SECRET;

  // 🔥 Fail-safe: if secret missing, don't break app routing
  if (!secret) {
    console.error("[middleware] NEXTAUTH_SECRET is missing");
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret,
  });

  // Debug (enable only if needed)
  // console.log("[middleware token]", token);

  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
      Protect everything except:
      - Next.js internals
      - static files
      - images
    */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};