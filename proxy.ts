import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;

  // Redirect root to the appropriate entry point
  if (pathname === "/") {
    const destination = isAuthenticated ? "/calendar" : "/onboarding";
    return NextResponse.redirect(new URL(destination, req.nextUrl));
  }

  // Redirect authenticated users away from the sign-in step
  if (pathname === "/onboarding" && isAuthenticated) {
    return NextResponse.redirect(
      new URL("/onboarding/connect-calendar", req.nextUrl)
    );
  }

  // /calendar protection is handled by the authorized() callback in auth.ts
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
