import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
	"/",
	"/login",
	"/register",
	"/forgot-password",
	"/reset-password",
	"/invite",
	"/docs",
	"/guides",
	"/check-email",
	"/verify-email",
	"/onboarding",
];

function isPublicPath(pathname: string): boolean {
	return PUBLIC_PATHS.some(
		(path) => pathname === path || pathname.startsWith(`${path}/`),
	);
}

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Skip public paths
	if (isPublicPath(pathname)) {
		return NextResponse.next();
	}

	// better-auth adds __Secure- prefix in production (HTTPS)
	// Check both for dev (HTTP) and prod (HTTPS) compatibility
	const sessionCookieName = request.url.startsWith("https")
		? "__Secure-better-auth.session_token"
		: "better-auth.session_token";
	const sessionToken = request.cookies.get(sessionCookieName);

	if (!sessionToken) {
		const loginUrl = new URL("/login", request.url);
		loginUrl.searchParams.set("redirect", pathname);
		return NextResponse.redirect(loginUrl);
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico, sitemap.xml, robots.txt (metadata files)
		 */
		"/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*$).*)",
	],
};
