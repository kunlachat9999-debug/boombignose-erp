"use client"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useT } from "@/components/locale-provider"
import { translateMessage } from "@/lib/i18n-messages"
import { updateBusinessProfile } from "../actions"

export function BusinessProfileForm({ orgId, initial }: { orgId: string; initial: { legalName: string; address: string; taxId: string; taxStatus: "unknown" | "not_registered" | "registered" } }) {
  const t = useT()
  const [value, setValue] = useState(initial)
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  return <form className="space-y-4" onSubmit={event => {
    event.preventDefault()
    startTransition(async () => {
      try {
        const result = await updateBusinessProfile({ ...value, expectedOrgId: orgId })
        if (result.error) { toast.error(translateMessage(t, result.error)); return }
        toast.success(t("Business profile saved", "บันทึกข้อมูลกิจการแล้ว"))
        router.refresh()
      } catch { toast.error(t("Could not confirm the profile update. Reload and check before retrying.", "ยืนยันการบันทึกไม่ได้ กรุณาโหลดหน้าใหม่และตรวจสอบก่อนลองอีกครั้ง")) }
    })
  }}>
    <label className="block text-sm">{t("Legal business name", "ชื่อกิจการตามเอกสาร")}<Input required maxLength={200} value={value.legalName} onChange={event => setValue({ ...value, legalName: event.target.value })} disabled={pending} /></label>
    <label className="block text-sm">{t("Business address", "ที่อยู่กิจการ")}<Textarea required maxLength={1000} value={value.address} onChange={event => setValue({ ...value, address: event.target.value })} disabled={pending} /></label>
    <label className="block text-sm">{t("Tax ID", "เลขประจำตัวผู้เสียภาษี")}<Input maxLength={13} value={value.taxId} onChange={event => setValue({ ...value, taxId: event.target.value })} disabled={pending} /></label>
    <label className="block text-sm">{t("VAT registration status", "สถานะ VAT")}<select className="mt-1 block w-full rounded border bg-background p-2" value={value.taxStatus} disabled={pending} onChange={event => setValue({ ...value, taxStatus: event.target.value as typeof value.taxStatus })}><option value="unknown">{t("Unknown", "ยังไม่ยืนยัน")}</option><option value="not_registered">{t("Not registered", "ไม่จดทะเบียน")}</option><option value="registered">{t("Registered", "จดทะเบียน")}</option></select></label>
    <p className="text-sm text-muted-foreground">{t("Issued documents retain their own copy of this profile. This operational invoice workflow does not calculate VAT or certify a tax invoice. Confirm treatment with your accountant.", "เอกสารที่ออกแต่ละครั้งจะเก็บสำเนาข้อมูลนี้ไว้ ระบบใบแจ้งหนี้นี้ไม่คำนวณ VAT และไม่ได้รับรองเป็นใบกำกับภาษี กรุณาปรึกษานักบัญชีของคุณ")}</p>
    <Button type="submit" disabled={pending}>{t("Save business profile", "บันทึกข้อมูลกิจการ")}</Button>
  </form>
}
