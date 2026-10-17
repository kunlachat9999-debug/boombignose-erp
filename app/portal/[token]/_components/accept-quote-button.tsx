"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

import { portalAcceptQuote } from "../portal-actions"
import { useT } from "@/components/locale-provider"
import { translateMessage } from "@/lib/i18n-messages"

export function AcceptQuoteButton({
  token,
  quoteId,
}: {
  token: string
  quoteId: string
}) {
  const router = useRouter()
  const t = useT()
  const [pending, startTransition] = useTransition()

  return (
    <Button
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await portalAcceptQuote({ token, quoteId })
          if (res?.error) {
            toast.error(translateMessage(t, res.error))
            return
          }
          toast.success(t("Quote accepted", "อนุมัติใบเสนอราคาแล้ว"))
          router.refresh()
        })
      }
    >
      <Check /> {t("Accept", "อนุมัติ")}
    </Button>
  )
}
