export type Locale = "th" | "en"

export const LOCALE_COOKIE = "locale"

export function parseLocale(value: string | undefined): Locale {
  return value === "en" ? "en" : "th"
}

/**
 * Translations live inline at the call site: `t("Save", "บันทึก")`.
 * Two languages only, so a key/dictionary layer would just add indirection.
 */
export type T = <V>(en: V, th: V) => V

export function translator(locale: Locale): T {
  return (en, th) => (locale === "en" ? en : th)
}
