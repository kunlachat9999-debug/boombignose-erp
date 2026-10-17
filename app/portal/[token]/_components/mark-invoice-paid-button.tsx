"use client"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { portalMarkInvoicePaid } from "../portal-actions"
import { useT } from "@/components/locale-provider"
import { translateMessage } from "@/lib/i18n-messages"

export function MarkInvoicePaidButton({ token, invoiceId }: { token: string; invoiceId: string }) {
  const router = useRouter()
  const t = useT()
  const [pending, startTransition] = useTransition()
  const [amount, setAmount] = useState("")
  const [reference, setReference] = useState("")
  const [key, setKey] = useState<string>()
  return <form className="space-y-2 min-w-48" onSubmit={e => {
    e.preventDefault()
    const requestKey = key ?? crypto.randomUUID()
    setKey(requestKey)
    startTransition(async () => {
      try {
      const result = await portalMarkInvoicePaid({token, invoiceId, amountBaht:amount, reference, key:requestKey})
      if (result.error) { toast.error(translateMessage(t, result.error)); return }
      toast.success(t("Submitted — pending verification", "ส่งหลักฐานแล้ว รอตรวจสอบ"))
      router.refresh()
      } catch { toast.error(t("Could not confirm the report. Retry unchanged details.", "ยืนยันการแจ้งชำระไม่ได้ กรุณาลองใหม่ด้วยข้อมูลเดิม")) }
    })
  }}>
    <Input aria-label={t("Reported payment amount (THB)", "ยอดที่แจ้งชำระ (บาท)")} inputMode="decimal" placeholder={t("Amount paid (฿)", "ยอดโอน (฿)")} value={amount} onChange={e=>{setAmount(e.target.value); setKey(undefined)}} required />
    <Input aria-label={t("Customer payment reference", "เลขอ้างอิงการชำระ")} placeholder={t("Transfer date and reference", "วันที่และเลขอ้างอิงการโอน")} value={reference} onChange={e=>{setReference(e.target.value); setKey(undefined)}} maxLength={500} required />
    <Button type="submit" size="sm" variant="outline" disabled={pending}>{t("Report payment", "แจ้งชำระเงิน")}</Button>
    <p className="text-xs text-muted-foreground">{t("Subject to receipt verification", "รอผู้ดูแลตรวจสอบก่อนตัดยอด")}</p>
  </form>
}
