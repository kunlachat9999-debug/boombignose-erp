"use client"

import { createContext, useContext, useTransition } from "react"
import { Languages } from "lucide-react"

import { setLocale } from "@/app/locale-actions"
import { Button } from "@/components/ui/button"
import { translator, type Locale } from "@/lib/i18n"

// "en" only applies without a provider (unit tests); the app always wraps in one.
const LocaleContext = createContext<Locale>("en")

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale
  children: React.ReactNode
}) {
  return <LocaleContext value={locale}>{children}</LocaleContext>
}

export function useLocale() {
  return useContext(LocaleContext)
}

export function useT() {
  return translator(useLocale())
}

export function LocaleToggle({ className }: { className?: string }) {
  const locale = useLocale()
  const [pending, startTransition] = useTransition()
  const next: Locale = locale === "th" ? "en" : "th"

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={className}
      disabled={pending}
      aria-label={locale === "th" ? "Switch to English" : "เปลี่ยนเป็นภาษาไทย"}
      onClick={() => startTransition(() => setLocale(next))}
    >
      <Languages />
      {next === "en" ? "EN" : "ไทย"}
    </Button>
  )
}
