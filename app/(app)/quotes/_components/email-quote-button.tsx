"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Mail } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

import { sendQuoteEmail } from "../email-actions"
import { useT } from "@/components/locale-provider"
import { translateMessage } from "@/lib/i18n-messages"

/**
 * "Email quote" — sends the quote to the client's contact email with a link to
 * its PDF and logs the activity. Surfaces the "not configured" and "no client
 * email" cases as friendly toasts rather than errors.
 */
export function EmailQuoteButton({ quoteId }: { quoteId: string }) {
  const router = useRouter()
  const t = useT()
  const [pending, startTransition] = useTransition()

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await sendQuoteEmail(quoteId)
          if (res.reason === "not_configured") {
            toast.warning(
              t(
                "Email is not configured. Set RESEND_API_KEY to enable sending.",
                "ยังไม่ได้ตั้งค่าอีเมล กรุณาตั้ง RESEND_API_KEY เพื่อเปิดการส่ง"
              )
            )
            return
          }
          if (res.error) {
            toast.error(translateMessage(t, res.error))
            return
          }
          toast.success(t("Quote emailed to the client", "ส่งใบเสนอราคาทางอีเมลถึงลูกค้าแล้ว"))
          router.refresh()
        })
      }
    >
      <Mail /> {pending ? t("Sending…", "กำลังส่ง…") : t("Email quote", "ส่งอีเมลใบเสนอราคา")}
    </Button>
  )
}
