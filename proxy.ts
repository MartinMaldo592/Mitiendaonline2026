import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const isHome = pathname === "/";
  const isProductos = pathname === "/productos" || pathname === "/productos/";

  if (!isHome && !isProductos) return NextResponse.next();

  const shouldNoindex = searchParams.toString().length > 0;

  if (!shouldNoindex) return NextResponse.next();

  const response = NextResponse.next();
  response.headers.set("x-robots-tag", "noindex,follow");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.blama.shop";
  const cleanPath = isProductos ? "/productos" : "/";
  response.headers.set("link", `<${siteUrl}${cleanPath}>; rel=\"canonical\"`);

  return response;
}

export const config = {
  matcher: ["/", "/productos/:path*"],
};
