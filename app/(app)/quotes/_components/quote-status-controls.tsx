"use client"

import { useRef, useTransition } from "react"
import { useRouter, unstable_rethrow } from "next/navigation"
import { Send, Check, X, FileOutput } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import type { Enums } from "@/lib/types/database"
import { quoteConversionKey } from "@/lib/workflows/service"

import { setQuoteStatus, convertQuoteToInvoice } from "../actions"
import { useT } from "@/components/locale-provider"
import { translateMessage } from "@/lib/i18n-messages"

export function QuoteStatusControls({
  quoteId,
  orgId,
  status,
  canConvert,
}: {
  quoteId: string
  orgId: string
  status: Enums<"quote_status">
  canConvert: boolean
}) {
  const router = useRouter()
  const t = useT()
  const [pending, startTransition] = useTransition()
  const conversionRequest = useRef<{ scope: string; key: string } | null>(null)

  function changeStatus(next: Exclude<Enums<"quote_status">, "converted">, message: string) {
    startTransition(async () => {
      const res = await setQuoteStatus({ id: quoteId, status: next })
      if (res?.error) {
        toast.error(translateMessage(t, res.error))
        return
      }
      toast.success(message)
      router.refresh()
    })
  }

  function convert() {
    startTransition(async () => {
      // Keep the same command identity after an error or an uncertain response.
      const scope = `${orgId}:${quoteId}`
      if (conversionRequest.current?.scope !== scope) {
        let key: string
        try {
          key = quoteConversionKey(window.sessionStorage, scope, () => crypto.randomUUID())
        } catch {
          key = crypto.randomUUID()
        }
        conversionRequest.current = { scope, key }
      }
      try {
        const res = await convertQuoteToInvoice({ id: quoteId, key: conversionRequest.current.key })
        // On success the action redirects; only errors return here.
        if (res?.error) toast.error(translateMessage(t, res.error))
      } catch (error) {
        unstable_rethrow(error)
        toast.error(
          t(
            "The conversion result could not be confirmed. Retry to recover the same invoice.",
            "ยืนยันผลการแปลงไม่ได้ กรุณาลองใหม่เพื่อเรียกคืนใบแจ้งหนี้เดิม"
          )
        )
      }
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "draft" ? (
        <Button
          size="sm"
          disabled={pending}
          onClick={() => changeStatus("sent", t("Quote marked as sent", "ทำเครื่องหมายว่าส่งแล้ว"))}
        >
          <Send /> {t("Mark sent", "ทำเครื่องหมายว่าส่งแล้ว")}
        </Button>
      ) : null}

      {status === "sent" ? (
        <>
          <Button
            size="sm"
            disabled={pending}
            onClick={() => changeStatus("accepted", t("Quote accepted", "อนุมัติใบเสนอราคาแล้ว"))}
          >
            <Check /> {t("Accept", "อนุมัติ")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => changeStatus("declined", t("Quote declined", "ปฏิเสธใบเสนอราคาแล้ว"))}
          >
            <X /> {t("Decline", "ปฏิเสธ")}
          </Button>
        </>
      ) : null}

      {status === "accepted" && canConvert ? (
        <Button size="sm" disabled={pending} onClick={convert}>
          <FileOutput /> {t("Create project and draft invoice", "สร้างโปรเจกต์และร่างใบแจ้งหนี้")}
        </Button>
      ) : null}
    </div>
  )
}
