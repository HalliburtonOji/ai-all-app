import { NextResponse } from "next/server";
import { LOCALE_COOKIE, isLocale } from "@/lib/i18n/locales";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function POST(request: Request) {
  const formData = await request.formData();
  const requested = (formData.get("locale") as string) ?? "";
  const referer = request.headers.get("referer") ?? "/dashboard";

  const response = NextResponse.redirect(referer, { status: 303 });
  if (isLocale(requested)) {
    response.cookies.set(LOCALE_COOKIE, requested, {
      path: "/",
      maxAge: ONE_YEAR_SECONDS,
      sameSite: "lax",
      httpOnly: false,
    });
  }
  return response;
}
