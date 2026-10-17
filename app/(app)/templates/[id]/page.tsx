import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, CheckCircle2, Pencil } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { requireOrgContext } from "@/lib/auth"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { formatTHB } from "@/lib/money"
import { DeleteTemplateButton } from "../_components/delete-template-button"
import { getT } from "@/lib/i18n-server"

export const dynamic = "force-dynamic"

/** Coerce the jsonb implementation_checklist into a clean list of step strings. */
function toSteps(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((s): s is string => typeof s === "string")
    .map((s) => s.trim())
    .filter(Boolean)
}

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await requireOrgContext()
  const t = await getT()
  const supabase = await createClient()

  const { data: template } = await supabase
    .from("automation_templates")
    .select(
      "id, name, description, internal_value_satang, price_satang, reusable_notes, implementation_checklist, tags, category_id"
    )
    .eq("id", id)
    .maybeSingle()

  if (!template) notFound()

  const { data: category } = template.category_id
    ? await supabase
        .from("template_categories")
        .select("name")
        .eq("id", template.category_id)
        .maybeSingle()
    : { data: null }

  const steps = toSteps(template.implementation_checklist)
  const tags = template.tags ?? []

  return (
    <div className="space-y-6">
      <PageHeader title={template.name} description={category?.name ?? t("Uncategorized", "ไม่มีหมวดหมู่")}>
        <Button variant="outline" render={<Link href="/templates" />}>
          <ArrowLeft /> {t("Back", "กลับ")}
        </Button>
        <Button variant="outline" render={<Link href={`/templates/${template.id}/edit`} />}>
          <Pencil /> {t("Edit", "แก้ไข")}
        </Button>
        <DeleteTemplateButton id={template.id} name={template.name} />
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("Overview", "ภาพรวม")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">
                {template.description || (
                  <span className="text-muted-foreground">{t("No description.", "ไม่มีคำอธิบาย")}</span>
                )}
              </p>
              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("Implementation checklist", "ขั้นตอนการติดตั้ง")}</CardTitle>
            </CardHeader>
            <CardContent>
              {steps.length === 0 ? (
                <p className="text-muted-foreground text-sm">{t("No steps yet.", "ยังไม่มีขั้นตอน")}</p>
              ) : (
                <ul className="space-y-2.5">
                  {steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {template.reusable_notes ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("Reusable notes", "บันทึกสำหรับใช้ซ้ำ")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{template.reusable_notes}</p>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">{t("Pricing", "ราคา")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("Client price", "ราคาขายลูกค้า")}</span>
              <span className="font-semibold">
                {template.price_satang != null
                  ? formatTHB(template.price_satang)
                  : "—"}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("Internal value", "มูลค่าภายใน")}</span>
              <span className="font-medium">
                {template.internal_value_satang != null
                  ? formatTHB(template.internal_value_satang)
                  : "—"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
