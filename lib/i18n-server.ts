import { cookies } from "next/headers"

import { LOCALE_COOKIE, parseLocale, translator, type Locale } from "@/lib/i18n"

export async function getLocale(): Promise<Locale> {
  try {
    return parseLocale((await cookies()).get(LOCALE_COOKIE)?.value)
  } catch {
    // No request scope (unit tests rendering pages/actions directly).
    return "en"
  }
}

export async function getT() {
  return translator(await getLocale())
}
