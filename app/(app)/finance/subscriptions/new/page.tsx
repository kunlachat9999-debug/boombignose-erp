import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { requireOrgContext } from "@/lib/auth"
import { todayISO } from "@/lib/dates"

import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import { createSubscription } from "../../subscription-actions"
import {
  SubscriptionForm,
  type SubscriptionFormValues,
} from "../../_components/subscription-form"
import type { Option } from "../../_components/form-fields"
import { getT } from "@/lib/i18n-server"

export const dynamic = "force-dynamic"

export default async function NewSubscriptionPage() {
  const ctx = await requireOrgContext()
  const t = await getT()
  const supabase = await createClient()

  const [clientsRes, projectsRes] = await Promise.all([
    supabase.from("clients").select("id, name").eq("org_id", ctx.orgId).order("name"),
    supabase.from("projects").select("id, name").eq("org_id", ctx.orgId).order("name"),
  ])

  const clients: Option[] = (clientsRes.data ?? []).map((c) => ({
    value: c.id,
    label: c.name,
  }))
  const projects: Option[] = (projectsRes.data ?? []).map((p) => ({
    value: p.id,
    label: p.name,
  }))

  const defaultValues: SubscriptionFormValues = {
    name: "",
    client_id: "",
    project_id: "",
    amountBaht: 0,
    interval: "monthly",
    start_date: todayISO(),
    notes: "",
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("New subscription", "เพิ่มรายการสมัครสมาชิก")}
        description={t("Bill a client automatically on a recurring schedule.", "เรียกเก็บเงินลูกค้าอัตโนมัติตามรอบ")}
      >
        <Button variant="outline" render={<Link href="/finance/subscriptions" />}>
          <ArrowLeft /> {t("Back", "กลับ")}
        </Button>
      </PageHeader>

      <Card className="max-w-3xl">
        <CardContent>
          <SubscriptionForm
            clients={clients}
            projects={projects}
            defaultValues={defaultValues}
            submitLabel={t("Create subscription", "สร้างรายการสมัครสมาชิก")}
            action={createSubscription}
          />
        </CardContent>
      </Card>
    </div>
  )
}
