"use client"

import * as React from "react"
import Link from "next/link"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatTHB } from "@/lib/money"
import type { Tables } from "@/lib/types/database"
import { useT } from "@/components/locale-provider"

type Category = Pick<Tables<"template_categories">, "id" | "name" | "slug">

export type TemplateCard = {
  id: string
  name: string
  description: string | null
  internalValueSatang: number | null
  priceSatang: number | null
  tags: string[]
  categoryId: string | null
}

const ALL = "__all__"
const UNCATEGORIZED = "__uncat__"

function TemplateTile({ tpl }: { tpl: TemplateCard }) {
  const t = useT()
  return (
    <Link href={`/templates/${tpl.id}`} className="group/tile block h-full">
      <Card className="h-full transition-colors group-hover/tile:ring-foreground/20">
        <CardHeader>
          <CardTitle className="leading-snug">{tpl.name}</CardTitle>
          {tpl.description ? (
            <p className="text-muted-foreground line-clamp-2 text-sm">
              {tpl.description}
            </p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            {tpl.priceSatang != null ? (
              <div>
                <span className="text-base font-semibold">
                  {formatTHB(tpl.priceSatang)}
                </span>
                <span className="text-muted-foreground ml-1 text-xs">{t("price", "ราคาขาย")}</span>
              </div>
            ) : null}
            {tpl.internalValueSatang != null ? (
              <div className="text-muted-foreground text-sm">
                {formatTHB(tpl.internalValueSatang)}
                <span className="ml-1 text-xs">{t("internal", "มูลค่าภายใน")}</span>
              </div>
            ) : null}
          </div>
          {tpl.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {tpl.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  )
}

function Grid({ items }: { items: TemplateCard[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((tpl) => (
        <TemplateTile key={tpl.id} tpl={tpl} />
      ))}
    </div>
  )
}

export function TemplatesLibrary({
  categories,
  templates,
}: {
  categories: Category[]
  templates: TemplateCard[]
}) {
  const t = useT()
  const [active, setActive] = React.useState<string>(ALL)

  const hasUncategorized = templates.some((tpl) => tpl.categoryId == null)

  // Group templates by category id for the "All" view.
  const groups = React.useMemo(() => {
    return categories
      .map((c) => ({
        id: c.id,
        name: c.name,
        items: templates.filter((tpl) => tpl.categoryId === c.id),
      }))
      .filter((g) => g.items.length > 0)
  }, [categories, templates])

  const uncategorized = templates.filter((tpl) => tpl.categoryId == null)

  const filtered =
    active === ALL
      ? templates
      : active === UNCATEGORIZED
        ? uncategorized
        : templates.filter((tpl) => tpl.categoryId === active)

  return (
    <Tabs value={active} onValueChange={(v) => setActive(v as string)}>
      <TabsList className="flex h-auto flex-wrap">
        <TabsTrigger value={ALL}>{t("All", "ทั้งหมด")}</TabsTrigger>
        {categories.map((c) => (
          <TabsTrigger key={c.id} value={c.id}>
            {c.name}
          </TabsTrigger>
        ))}
        {hasUncategorized ? (
          <TabsTrigger value={UNCATEGORIZED}>{t("Uncategorized", "ไม่มีหมวดหมู่")}</TabsTrigger>
        ) : null}
      </TabsList>

      {active === ALL ? (
        <div className="space-y-8">
          {groups.map((g) => (
            <section key={g.id} className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground">
                {g.name}
              </h2>
              <Grid items={g.items} />
            </section>
          ))}
          {uncategorized.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground">
                {t("Uncategorized", "ไม่มีหมวดหมู่")}
              </h2>
              <Grid items={uncategorized} />
            </section>
          ) : null}
        </div>
      ) : (
        <Grid items={filtered} />
      )}
    </Tabs>
  )
}
