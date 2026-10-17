import Link from "next/link"
import { requireOrgContext } from "@/lib/auth"
import { getT } from "@/lib/i18n-server"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { BusinessProfileForm } from "../_components/business-profile-form"
export const dynamic = "force-dynamic"
export default async function BusinessProfilePage() {
  const ctx = await requireOrgContext()
  const t = await getT()
  if (ctx.role === "member") return <p>{t("Only owners and admins can manage the business profile.", "เฉพาะเจ้าของและผู้ดูแลเท่านั้นที่จัดการข้อมูลกิจการได้")}</p>
  const supabase = await createClient()
  const { data, error } = await supabase.from("org_settings").select("legal_name, business_address, tax_id, tax_status").eq("org_id", ctx.orgId).maybeSingle()
  if (error) throw new Error("Business profile unavailable")
  const taxStatus = data?.tax_status
  return <div className="space-y-6"><PageHeader title={t("Business profile", "ข้อมูลกิจการ")} description={t("Prepare the issuer details before issuing an operational invoice.", "เตรียมข้อมูลผู้ออกเอกสารก่อนออกใบแจ้งหนี้")}><Button variant="outline" render={<Link href="/finance" />}>{t("Back to finance", "กลับไปหน้าการเงิน")}</Button></PageHeader><Card className="max-w-3xl"><CardContent><BusinessProfileForm orgId={ctx.orgId} initial={{ legalName: data?.legal_name ?? "", address: data?.business_address ?? "", taxId: data?.tax_id ?? "", taxStatus: taxStatus === "registered" || taxStatus === "not_registered" ? taxStatus : "unknown" }} /></CardContent></Card></div>
}
