"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { Enums } from "@/lib/types/database"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useT } from "@/components/locale-provider"
import { enumLabel } from "@/lib/enum-labels"
import { translateMessage } from "@/lib/i18n-messages"
import { paymentAmount } from "@/lib/payments/input"
import { paymentCommandKey } from "@/lib/payments/retry-command"
import { recordPayment, reconcileLegacyPayment } from "../actions"

/** Bank reports stay pending. Legacy matching creates a new linked receipt. */
export function PaymentForm({ orgId, invoiceId, suggestedBaht, legacyPaymentId, today }: {
  orgId: string; invoiceId: string; suggestedBaht: string; legacyPaymentId?: string; today: string
}) {
  const t = useT()
  const router = useRouter()
  const [amount, setAmount] = useState(suggestedBaht)
  const [paidOn, setPaidOn] = useState(today)
  const [method, setMethod] = useState<Enums<"payment_method">>("transfer")
  const [reference, setReference] = useState("")
  const [confirmed, setConfirmed] = useState(false)
  const [pending, startTransition] = useTransition()
  const command = useRef<{ details: string; key: string } | null>(null)
  const scope = `${orgId}/${invoiceId}/${legacyPaymentId ?? "staff-report"}`
  const reconcile = !!legacyPaymentId

  function submit() {
    try { paymentAmount(amount) } catch { toast.error(t("Enter a positive THB amount with up to two decimals", "กรุณากรอกจำนวนเงินบาทที่มากกว่า 0 ทศนิยมไม่เกิน 2 ตำแหน่ง")); return }
    if (reference.trim().length < 3 || (reconcile && !confirmed)) return
    const details = JSON.stringify([amount, reference.trim(), ...(reconcile ? [paidOn, method] : [])])
    if (command.current?.details !== details) {
      let key: string
      try { key = paymentCommandKey(sessionStorage, scope, [amount, reference.trim(), ...(reconcile ? [paidOn, method] : [])], () => crypto.randomUUID()) }
      catch { key = crypto.randomUUID() }
      command.current = { details, key }
    }
    const key = command.current.key
    startTransition(async () => {
      try {
        const input = { invoiceId, amountBaht: amount, reference: reference.trim(), key }
        const result = legacyPaymentId
          ? await reconcileLegacyPayment({ ...input, legacyPaymentId, paidOn, method })
          : await recordPayment(input)
        if (result.error) { toast.error(translateMessage(t, result.error)); return }
        toast.success(reconcile ? t("Legacy receipt reconciled", "สร้างใบรับเงินที่ตรวจสอบแล้ว") : t("Payment claim submitted", "ส่งแจ้งชำระแล้ว รอตรวจสอบ"))
        router.refresh()
      } catch { toast.error(t("Could not confirm the response. Retry unchanged details to recover the original result.", "ยืนยันผลไม่ได้ กรุณาลองใหม่ด้วยข้อมูลเดิมเพื่อเรียกคืนผลลัพธ์")) }
    })
  }
  return <div className="space-y-3">
    <label className="block text-sm">{reconcile ? t("Verified legacy amount (THB)", "ยอดเดิมที่ตรวจสอบแล้ว (บาท)") : t("Reported amount (THB)", "ยอดที่แจ้งชำระ (บาท)")}
      <Input inputMode="decimal" value={amount} onChange={event => setAmount(event.target.value)} disabled={pending} />
    </label>
    <label className="block text-sm">{reconcile ? t("Legacy bank evidence reference", "เลขอ้างอิงหลักฐานธนาคารของยอดเดิม") : t("Staff payment report reference", "เลขอ้างอิงการแจ้งชำระโดยเจ้าหน้าที่")}
      <Input value={reference} onChange={event => setReference(event.target.value)} maxLength={500} disabled={pending} placeholder={t("Statement transaction or receipt reference", "เลขรายการในสเตตเมนต์หรือเลขใบเสร็จ")} />
    </label>
    {reconcile ? <><label className="block text-sm">{t("Legacy bank receipt date", "วันที่รับเงินตามธนาคาร (ยอดเดิม)")}<Input disabled={pending} type="date" max={today} value={paidOn} onChange={event=>setPaidOn(event.target.value)} /></label><label className="block text-sm">{t("Legacy receipt method", "วิธีรับเงิน (ยอดเดิม)")}<select disabled={pending} className="block w-full rounded border p-2 bg-background" value={method} onChange={event=>setMethod(event.target.value as Enums<"payment_method">)}>{(["transfer","promptpay","cash","card","cheque","other"] as const).map(value=><option key={value} value={value}>{enumLabel(t, "payment_method", value)}</option>)}</select></label></> : null}
    {reconcile ? <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} disabled={pending} />{t("I matched this retained receipt to actual bank evidence. A new verified receipt will be linked; the original stays in the history.", "ฉันจับคู่ใบรับเงินเดิมนี้กับหลักฐานธนาคารจริงแล้ว ระบบจะสร้างใบรับเงินที่ตรวจสอบแล้วและผูกไว้ ส่วนรายการเดิมยังเก็บในประวัติ")}</label> : <p className="text-xs text-muted-foreground">{t("This report has no effect on received cash until verified.", "บันทึกคำแจ้งชำระ รอเจ้าหน้าที่ตรวจสอบ ยังไม่นับเป็นเงินที่ได้รับจนกว่าจะตรวจสอบ")}</p>}
    <Button onClick={submit} disabled={pending || reference.trim().length < 3 || (reconcile && !confirmed)}>{reconcile ? t("Reconcile legacy receipt", "กระทบยอดใบรับเงินเดิม") : t("Report payment for verification", "แจ้งชำระเพื่อรอตรวจสอบ")}</Button>
  </div>
}
