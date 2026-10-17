"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Mail } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

import { sendInvoiceEmail } from "../email-actions"
import { useT } from "@/components/locale-provider"
import { translateMessage } from "@/lib/i18n-messages"

/**
 * "Email invoice" — sends the invoice to the client's contact email with a link
 * to its PDF and logs the activity. Surfaces the "not configured" and "no client
 * email" cases as friendly toasts rather than errors.
 */
export function EmailInvoiceButton({ invoiceId }: { invoiceId: string }) {
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
          const res = await sendInvoiceEmail(invoiceId)
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
          toast.success(t("Invoice emailed to the client", "ส่งใบแจ้งหนี้ทางอีเมลถึงลูกค้าแล้ว"))
          router.refresh()
        })
      }
    >
      <Mail /> {pending ? t("Sending…", "กำลังส่ง…") : t("Email invoice", "ส่งอีเมลใบแจ้งหนี้")}
    </Button>
  )
}
