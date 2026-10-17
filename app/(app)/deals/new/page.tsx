import { createClient } from "@/lib/supabase/server"
import { requireOrgContext } from "@/lib/auth"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { DealForm } from "../_components/deal-form"
import { createDeal } from "../actions"
import { getT } from "@/lib/i18n-server"

export const dynamic = "force-dynamic"

export default async function NewDealPage() {
  const ctx = await requireOrgContext()
  const t = await getT()
  const supabase = await createClient()
  const { data: clients } = await supabase
    .from("clients")
    .select("id,name")
    .eq("org_id", ctx.orgId)
    .order("name")

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("New deal", "เพิ่มดีล")}
        description={t("Add a deal to your pipeline.", "เพิ่มดีลเข้าไปในรายการขาย")}
      />
      <Card className="max-w-2xl">
        <CardContent>
          <DealForm clients={clients ?? []} action={createDeal} submitLabel={t("Create deal", "สร้างดีล")} />
        </CardContent>
      </Card>
    </div>
  )
}
