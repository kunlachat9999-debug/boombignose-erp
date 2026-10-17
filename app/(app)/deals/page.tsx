import Link from "next/link"
import { Plus, Target, CalendarClock } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { requireOrgContext } from "@/lib/auth"
import { todayISO } from "@/lib/dates"
import { formatTHB, formatTHBWhole } from "@/lib/money"
import {
  pipelineValue,
  weightedPipelineValue,
  type DealStage,
} from "@/lib/metrics/pipeline"
import { Constants } from "@/lib/types/database"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

import { DealsToolbar } from "./_components/deals-toolbar"
import type { SavedView } from "@/app/(app)/views/saved-views-menu"
import type { ViewConfig } from "@/app/(app)/views/view-config"
import { enumLabel } from "@/lib/enum-labels"
import { getT } from "@/lib/i18n-server"

export const dynamic = "force-dynamic"

const DEAL_STAGES = Constants.public.Enums.deal_stage
const COLUMNS = DEAL_STAGES.map((stage) => ({ stage }))

/** Pull the known filter keys out of a saved-view config row. */
function toViewConfig(config: unknown): ViewConfig {
  const c = (config ?? {}) as Record<string, unknown>
  const out: ViewConfig = {}
  if (typeof c.stage === "string") out.stage = c.stage
  if (typeof c.q === "string") out.q = c.q
  return out
}

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; q?: string }>
}) {
  const ctx = await requireOrgContext()
  const t = await getT()
  const supabase = await createClient()
  const today = todayISO()

  const { stage: stageParam, q: qParam } = await searchParams
  const stage = (DEAL_STAGES as readonly string[]).includes(stageParam ?? "")
    ? (stageParam as DealStage)
    : ""
  const q = (qParam ?? "").trim()

  const [dealsRes, clientsRes, viewsRes] = await Promise.all([
    supabase
      .from("deals")
      .select(
        "id,title,stage,value_satang,client_id,next_follow_up_date,created_at"
      )
      .eq("org_id", ctx.orgId)
      .order("created_at", { ascending: false }),
    supabase.from("clients").select("id,name").eq("org_id", ctx.orgId),
    supabase
      .from("saved_views")
      .select("id, name, config")
      .eq("org_id", ctx.orgId)
      .eq("module", "deals")
      .eq("user_id", ctx.userId)
      .order("created_at", { ascending: true }),
  ])

  const allDeals = dealsRes.data ?? []
  const clients = clientsRes.data ?? []
  const clientName = new Map(clients.map((c) => [c.id, c.name]))

  const savedViews: SavedView[] = (viewsRes.data ?? []).map((v) => ({
    id: v.id,
    name: v.name,
    config: toViewConfig(v.config),
  }))

  // Apply filters in-memory (board stays a server component).
  const qLower = q.toLowerCase()
  const deals = allDeals.filter((d) => {
    if (stage && d.stage !== stage) return false
    if (qLower && !d.title.toLowerCase().includes(qLower)) return false
    return true
  })

  // When a stage is selected, only show that column.
  const visibleColumns = stage
    ? COLUMNS.filter((col) => col.stage === stage)
    : COLUMNS

  // Headline KPIs summarize the whole pipeline, independent of the active filter.
  const openValue = pipelineValue(allDeals)
  const weighted = weightedPipelineValue(allDeals)

  const byStage = new Map<DealStage, typeof deals>()
  for (const col of COLUMNS) byStage.set(col.stage, [])
  for (const d of deals) byStage.get(d.stage)?.push(d)

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Deals", "ดีล")}
        description={t("Your sales pipeline and follow-ups.", "ยอดขายที่รอปิดและงานติดตามของคุณ")}
      >
        <Button render={<Link href="/deals/new" />}>
          <Plus className="size-4" />
          {t("New deal", "เพิ่มดีล")}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 sm:max-w-lg">
        <StatCard
          label={t("Open pipeline", "ดีลที่รอปิด")}
          value={formatTHBWhole(openValue)}
          icon={Target}
          hint={t("Value of deals still in play", "มูลค่าดีลที่ยังเปิดอยู่")}
        />
        <StatCard
          label={t("Weighted pipeline", "มูลค่าถ่วงน้ำหนัก")}
          value={formatTHBWhole(weighted)}
          icon={Target}
          hint={t("By stage win-probability", "ตามโอกาสปิดของแต่ละขั้นตอน")}
        />
      </div>

      {allDeals.length === 0 ? null : (
        <DealsToolbar stage={stage} q={q} savedViews={savedViews} />
      )}

      {allDeals.length === 0 ? (
        <EmptyState
          icon={Target}
          title={t("No deals yet", "ยังไม่มีดีล")}
          description={t("Create your first deal to start tracking your pipeline.", "สร้างดีลแรกเพื่อเริ่มติดตามยอดขาย")}
          action={
            <Button render={<Link href="/deals/new" />}>
              <Plus className="size-4" />
              {t("New deal", "เพิ่มดีล")}
            </Button>
          }
        />
      ) : deals.length === 0 ? (
        <EmptyState
          icon={Target}
          title={t("No matching deals", "ไม่พบดีลที่ค้นหา")}
          description={t("No deals match the current filters. Try clearing the search or stage filter.", "ไม่มีดีลที่ตรงกับตัวกรอง ลองล้างคำค้นหาหรือตัวกรองขั้นตอน")}
        />
      ) : (
        <div className="-mx-4 overflow-x-auto px-4 pb-2 md:-mx-6 md:px-6">
          <div className="flex min-w-max gap-4">
            {visibleColumns.map((col) => {
              const colDeals = byStage.get(col.stage) ?? []
              const colTotal = colDeals.reduce(
                (acc, d) => acc + d.value_satang,
                0
              )
              return (
                <div key={col.stage} className="w-72 shrink-0">
                  <div className="mb-2 flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">
                        {enumLabel(t, "deal_stage", col.stage)}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {colDeals.length}
                      </span>
                    </div>
                    <span className="text-muted-foreground text-xs">
                      {formatTHBWhole(colTotal)}
                    </span>
                  </div>
                  <div className="space-y-2 rounded-lg bg-muted/40 p-2">
                    {colDeals.length === 0 ? (
                      <p className="text-muted-foreground px-2 py-6 text-center text-xs">
                        {t("No deals", "ไม่มีดีล")}
                      </p>
                    ) : (
                      colDeals.map((d) => (
                        <DealCard
                          key={d.id}
                          id={d.id}
                          title={d.title}
                          client={clientName.get(d.client_id) ?? "—"}
                          valueSatang={d.value_satang}
                          followUp={d.next_follow_up_date}
                          today={today}
                        />
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function DealCard({
  id,
  title,
  client,
  valueSatang,
  followUp,
  today,
}: {
  id: string
  title: string
  client: string
  valueSatang: number
  followUp: string | null
  today: string
}) {
  const overdue = followUp != null && followUp < today
  const dueToday = followUp === today

  return (
    <Card className="gap-0 py-0 transition-colors hover:border-ring">
      <CardContent className="p-3">
        <Link href={`/deals/${id}`} className="block space-y-1.5">
          <div className="text-sm font-medium leading-snug">{title}</div>
          <div className="text-muted-foreground text-xs">{client}</div>
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <span className="text-sm font-semibold">{formatTHB(valueSatang)}</span>
            {followUp ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-xs",
                  overdue
                    ? "font-medium text-red-600 dark:text-red-400"
                    : dueToday
                      ? "font-medium text-amber-600 dark:text-amber-400"
                      : "text-muted-foreground"
                )}
              >
                <CalendarClock className="size-3" />
                {followUp}
              </span>
            ) : null}
          </div>
        </Link>
      </CardContent>
    </Card>
  )
}
