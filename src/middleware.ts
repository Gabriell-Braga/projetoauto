import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, defaultLandingPath, verifySessionToken } from "@/lib/auth/session";

/**
 * Middleware Edge: só faz verificação criptográfica do JWT e roteamento.
 * Checagens que dependem de estado (usuário ativo, tenant suspenso, permissões)
 * ficam nos guards do servidor — assim o middleware não consome D1 a cada request.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const claims = token ? await verifySessionToken(token) : null;

  if (pathname === "/login") {
    if (claims) {
      const url = request.nextUrl.clone();
      url.pathname = defaultLandingPath(claims.role);
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (!claims) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/super-admin") && (claims.role !== "super_admin" || claims.imp)) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") && !claims.tenantId) {
    const url = request.nextUrl.clone();
    url.pathname = "/super-admin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/super-admin/:path*", "/login"],
};
