import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { requireOrgContext } from "@/lib/auth"
import { todayISO } from "@/lib/dates"

import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import { createQuote } from "../actions"
import { QuoteForm, type QuoteFormValues } from "../_components/quote-form"
import type { Option } from "../_components/form-fields"
import { getT } from "@/lib/i18n-server"

export const dynamic = "force-dynamic"

export default async function NewQuotePage() {
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

  const defaultValues: QuoteFormValues = {
    client_id: "",
    project_id: "",
    number: "",
    issue_date: todayISO(),
    valid_until: "",
    discountBaht: 0,
    notes: "",
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("New quote", "สร้างใบเสนอราคา")}
        description={t(
          "Draft a proposal — add line items after creating it.",
          "ร่างใบเสนอราคา — เพิ่มรายการได้หลังสร้างแล้ว"
        )}
      >
        <Button variant="outline" render={<Link href="/quotes" />}>
          <ArrowLeft /> {t("Back", "กลับ")}
        </Button>
      </PageHeader>

      <Card className="max-w-3xl">
        <CardContent>
          <QuoteForm
            clients={clients}
            projects={projects}
            defaultValues={defaultValues}
            submitLabel={t("Create quote", "สร้างใบเสนอราคา")}
            action={createQuote}
          />
        </CardContent>
      </Card>
    </div>
  )
}
