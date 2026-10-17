"use server"

import { cookies } from "next/headers"

import { LOCALE_COOKIE, parseLocale } from "@/lib/i18n"

export async function setLocale(locale: string) {
  ;(await cookies()).set(LOCALE_COOKIE, parseLocale(locale), {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  })
}
