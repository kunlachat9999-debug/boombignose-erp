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
import { paymentCommandKey } from "@/lib/payments/retry-command"
import { reviewPaymentClaim } from "../actions"

export function ReviewClaimForm({orgId,claimId,invoiceId,suggestedBaht,today}:{orgId:string;claimId:string;invoiceId:string;suggestedBaht:string;today:string}) {
  const t=useT()
  const router=useRouter()
  const [amount,setAmount]=useState(suggestedBaht)
  const [paidOn,setPaidOn]=useState(today)
  const [method,setMethod]=useState<Enums<"payment_method">>("transfer")
  const [reference,setReference]=useState("")
  const [pending,startTransition]=useTransition()
  const request=useRef<{key:string;decision:"verified"|"rejected";amountBaht:string;reference:string} | undefined>(undefined)
  function review(decision:"verified"|"rejected") {
    const current=request.current
    let key=current?.decision===decision ? current.key : undefined
    if (!key) {
      try { key=paymentCommandKey(sessionStorage, `${orgId}/${claimId}/review`, [decision,amount,reference,paidOn,method],()=>crypto.randomUUID()) }
      catch { key=crypto.randomUUID() }
    }
    const command={key,decision,amountBaht:amount,reference}
    request.current=command
    startTransition(async()=>{
      try {
      const result=await reviewPaymentClaim({claimId,invoiceId,...command,paidOn,method})
      if(result.error) { toast.error(translateMessage(t, result.error)); return }
      toast.success(decision==="verified"?t("Receipt verified","ตรวจสอบและตัดยอดแล้ว"):t("Claim rejected","ปฏิเสธรายการแล้ว"))
      router.refresh()
      } catch { toast.error(t("Could not confirm the response. Retry unchanged details to recover the original result.","ยืนยันผลไม่ได้ กรุณาลองใหม่ด้วยข้อมูลเดิมเพื่อเรียกคืนผลลัพธ์")) }
    })
  }
  return <div className="space-y-2">
    <Input disabled={pending} aria-label={t("Verified amount (THB)","ยอดที่ตรวจสอบแล้ว (บาท)")} inputMode="decimal" value={amount} onChange={e=>{setAmount(e.target.value); request.current=undefined}} />
    <Input disabled={pending} aria-label={t("Verification evidence reference","เลขอ้างอิงหลักฐานการตรวจสอบ")} placeholder={t("Bank receipt reference or rejection reason","เลขอ้างอิงการรับเงินหรือเหตุผลที่ปฏิเสธ")} value={reference} onChange={e=>{setReference(e.target.value); request.current=undefined}} maxLength={500} />
    <label className="block text-sm">{t("Bank receipt date","วันที่รับเงินตามธนาคาร")}<Input disabled={pending} type="date" max={today} value={paidOn} onChange={event=>{setPaidOn(event.target.value);request.current=undefined}} /></label>
    <label className="block text-sm">{t("Receipt method","วิธีรับเงิน")}<select disabled={pending} className="block w-full rounded border p-2 bg-background" value={method} onChange={event=>{setMethod(event.target.value as Enums<"payment_method">);request.current=undefined}}>{(["transfer","promptpay","cash","card","cheque","other"] as const).map(value=><option key={value} value={value}>{enumLabel(t,"payment_method",value)}</option>)}</select></label>
    <p className="text-xs text-muted-foreground">{t("Match the actual receipt before approval.","ตรวจสอบยอดรับเงินจริงและเลขอ้างอิงก่อนยืนยัน")}</p>
    <div className="flex gap-2"><Button disabled={pending||reference.trim().length<3} onClick={()=>review("verified")}>{t("Verify receipt","ยืนยันการรับเงิน")}</Button>
    <Button variant="outline" disabled={pending||reference.trim().length<3} onClick={()=>review("rejected")}>{t("Reject claim","ปฏิเสธรายการ")}</Button></div>
  </div>
}
