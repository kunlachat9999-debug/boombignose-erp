import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { requireOrgContext } from "@/lib/auth"
import { todayISO } from "@/lib/dates"

import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import { createCost } from "../../actions"
import { CostForm } from "../../_components/cost-form"
import type { Option } from "../../_components/form-fields"
import { getT } from "@/lib/i18n-server"

export const dynamic = "force-dynamic"

export default async function NewCostPage() {
  const ctx = await requireOrgContext()
  const t = await getT()
  const supabase = await createClient()

  const projectsRes = await supabase
    .from("projects")
    .select("id, name")
    .eq("org_id", ctx.orgId)
    .order("name")

  const projects: Option[] = (projectsRes.data ?? []).map((p) => ({
    value: p.id,
    label: p.name,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("New cost", "เพิ่มค่าใช้จ่าย")}
        description={t(
          "Log an operating cost — software, contractors, infra, and more.",
          "บันทึกค่าใช้จ่ายดำเนินงาน — ซอฟต์แวร์ ผู้รับจ้าง โครงสร้างพื้นฐาน และอื่น ๆ"
        )}
      >
        <Button variant="outline" render={<Link href="/finance" />}>
          <ArrowLeft /> {t("Back", "กลับ")}
        </Button>
      </PageHeader>

      <Card className="max-w-3xl">
        <CardContent>
          <CostForm
            projects={projects}
            today={todayISO()}
            action={createCost}
          />
        </CardContent>
      </Card>
    </div>
  )
}
