import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { requireOrgContext } from "@/lib/auth"
import { todayISO } from "@/lib/dates"

import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import { createInvoice } from "../../actions"
import {
  InvoiceForm,
  type InvoiceFormValues,
} from "../../_components/invoice-form"
import type { Option } from "../../_components/form-fields"
import { getT } from "@/lib/i18n-server"

export const dynamic = "force-dynamic"

export default async function NewInvoicePage() {
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

  const defaultValues: InvoiceFormValues = {
    client_id: "",
    project_id: "",
    number: "",
    status: "draft",
    issue_date: todayISO(),
    due_date: "",
    amountBaht: "0.00",
    is_recurring: false,
    recurring_interval: undefined,
    notes: "",
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("New invoice", "สร้างใบแจ้งหนี้")}
        description={t("Bill a client for work delivered or scheduled.", "เรียกเก็บเงินลูกค้าสำหรับงานที่ส่งมอบหรือกำหนดไว้")}
      >
        <Button variant="outline" render={<Link href="/finance" />}>
          <ArrowLeft /> {t("Back", "กลับ")}
        </Button>
      </PageHeader>

      <Card className="max-w-3xl">
        <CardContent>
          <InvoiceForm
            clients={clients}
            projects={projects}
            defaultValues={defaultValues}
            submitLabel={t("Create invoice", "สร้างใบแจ้งหนี้")}
            action={createInvoice}
          />
        </CardContent>
      </Card>
    </div>
  )
}
