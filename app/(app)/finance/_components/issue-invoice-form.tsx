"use client"
import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useT } from "@/components/locale-provider"
import { translateMessage } from "@/lib/i18n-messages"
import { paymentCommandKey } from "@/lib/payments/retry-command"
import { issueInvoice } from "../actions"

export function IssueInvoiceForm({ orgId, invoiceId, version }: { orgId: string; invoiceId: string; version: number }) {
  const t = useT()
  const [confirmed, setConfirmed] = useState(false)
  const [pending, startTransition] = useTransition()
  const request = useRef<string | null>(null)
  const router = useRouter()
  return <div className="space-y-3"><p className="text-sm text-muted-foreground">{t("Issuance freezes this version’s issuer, buyer, priced lines, discount and dates. It does not calculate VAT or create a tax invoice.", "การออกเอกสารจะล็อกข้อมูลผู้ออก ผู้ซื้อ รายการและราคา ส่วนลด และวันที่ของฉบับนี้ ระบบไม่คำนวณ VAT และไม่ได้ออกใบกำกับภาษี")}</p><label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={confirmed} disabled={pending} onChange={event => setConfirmed(event.target.checked)} />{t("I checked the business profile, buyer, lines, discount and dates.", "ฉันตรวจสอบข้อมูลกิจการ ผู้ซื้อ รายการ ส่วนลด และวันที่แล้ว")}</label><Button disabled={!confirmed || pending} onClick={() => {
    if (!request.current) {
      try { request.current = paymentCommandKey(sessionStorage, `${orgId}/${invoiceId}/issue`, [String(version)], () => crypto.randomUUID()) }
      catch { request.current = crypto.randomUUID() }
    }
    const key = request.current
    startTransition(async () => {
      try {
        const result = await issueInvoice({ invoiceId, expectedVersion: version, key })
        if (result.error) { toast.error(translateMessage(t, result.error)); return }
        toast.success(t("Operational invoice issued", "ออกเอกสารแล้ว"))
        router.refresh()
      } catch { toast.error(t("Could not confirm the issue response. Retry unchanged details to recover the original result.", "ยืนยันผลการออกเอกสารไม่ได้ กรุณาลองใหม่ด้วยข้อมูลเดิมเพื่อเรียกคืนผลลัพธ์")) }
    })
  }}>{t("Issue operational invoice", "ออกใบแจ้งหนี้")}</Button></div>
}
