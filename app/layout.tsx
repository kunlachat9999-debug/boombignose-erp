import type { Metadata } from "next"
import { Geist, Geist_Mono, Noto_Sans_Thai } from "next/font/google"
import "./globals.css"

import { LocaleProvider } from "@/components/locale-provider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { getLocale } from "@/lib/i18n-server"

const fontSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const fontThai = Noto_Sans_Thai({
  variable: "--font-thai",
  subsets: ["thai"],
})

const fontMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "BoomBigNose Company OS",
  description:
    "AI-native Company OS — CRM, project delivery, finance visibility, automation, and management dashboards.",
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale()

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${fontSans.variable} ${fontThai.variable} ${fontMono.variable} h-full antialiased`}
    >
      <body className="bg-background text-foreground min-h-full">
        <LocaleProvider locale={locale}>
          <TooltipProvider>{children}</TooltipProvider>
        </LocaleProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
