import Link from "next/link"
import { Plus, Sparkles } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { requireOrgContext } from "@/lib/auth"
import { PageHeader } from "@/components/page-header"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { NewCategoryDialog } from "./_components/new-category-dialog"
import { TemplatesLibrary, type TemplateCard } from "./_components/templates-library"
import { getT } from "@/lib/i18n-server"

export const dynamic = "force-dynamic"

export default async function TemplatesPage() {
  await requireOrgContext()
  const t = await getT()
  const supabase = await createClient()

  const [{ data: categories }, { data: templates }] = await Promise.all([
    supabase
      .from("template_categories")
      .select("id, name, slug")
      .order("name", { ascending: true }),
    supabase
      .from("automation_templates")
      .select(
        "id, name, description, internal_value_satang, price_satang, tags, category_id"
      )
      .order("name", { ascending: true }),
  ])

  const cards: TemplateCard[] = (templates ?? []).map((tpl) => ({
    id: tpl.id,
    name: tpl.name,
    description: tpl.description,
    internalValueSatang: tpl.internal_value_satang,
    priceSatang: tpl.price_satang,
    tags: tpl.tags ?? [],
    categoryId: tpl.category_id,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Templates", "เทมเพลต")}
        description={t(
          "Your reusable automation playbooks — price them, tag them, ship them.",
          "คู่มืองานอัตโนมัติที่นำกลับมาใช้ได้ — ตั้งราคา ติดแท็ก แล้วส่งมอบ"
        )}
      >
        <NewCategoryDialog />
        <Button render={<Link href="/templates/new" />}>
          <Plus /> {t("New template", "สร้างเทมเพลต")}
        </Button>
      </PageHeader>

      {cards.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title={t("No templates yet", "ยังไม่มีเทมเพลต")}
          description={t(
            "Capture your first reusable automation so you can quote and deliver it faster next time.",
            "บันทึกงานอัตโนมัติแรกไว้ใช้ซ้ำ เพื่อเสนอราคาและส่งมอบได้เร็วขึ้นในครั้งหน้า"
          )}
          action={
            <Button render={<Link href="/templates/new" />}>
              <Plus /> {t("New template", "สร้างเทมเพลต")}
            </Button>
          }
        />
      ) : (
        <TemplatesLibrary categories={categories ?? []} templates={cards} />
      )}
    </div>
  )
}
