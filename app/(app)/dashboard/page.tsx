import {
  Wallet,
  TrendingUp,
  Flame,
  Hourglass,
  Target,
  Repeat,
  FileWarning,
  Briefcase,
  CalendarClock,
  AlertTriangle,
  FileText,
  Clock,
} from "lucide-react"

import { getDashboardData } from "@/lib/queries/dashboard"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { EmptyState } from "@/components/empty-state"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatTHB, formatTHBWhole } from "@/lib/money"
import { enumLabel } from "@/lib/enum-labels"
import type { T } from "@/lib/i18n"
import { getT } from "@/lib/i18n-server"

export const dynamic = "force-dynamic"

function runwayLabel(t: T, months: number | null): { value: string; hint: string; tone: "default" | "positive" | "warning" | "negative" } {
  if (months === null) return { value: "∞", hint: t("Revenue ≥ burn this month", "รายได้ ≥ รายจ่ายเดือนนี้"), tone: "positive" }
  const value = t(`${months.toFixed(1)} mo`, `${months.toFixed(1)} เดือน`)
  if (months < 6) return { value, hint: t("Runway under 6 months", "เงินสำรองอยู่ได้ไม่ถึง 6 เดือน"), tone: "negative" }
  if (months < 12) return { value, hint: t("Keep an eye on burn", "ควรจับตารายจ่าย"), tone: "warning" }
  return { value, hint: t("Healthy runway", "เงินสำรองอยู่ในเกณฑ์ดี"), tone: "default" }
}

export default async function DashboardPage() {
  const d = await getDashboardData()
  const t = await getT()
  const runway = runwayLabel(t, d.runwayMonths)

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Dashboard", "แดชบอร์ด")}
        description={t(
          "Cash, pipeline, delivery, and what needs attention today.",
          "เงินสด ยอดขายที่รอปิด งานส่งมอบ และสิ่งที่ต้องจัดการวันนี้"
        )}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label={t("Cash on hand", "เงินสดคงเหลือ")}
          value={formatTHBWhole(d.cashSatang)}
          icon={Wallet}
          hint={t("Manual balance · edit in Settings", "ยอดที่กรอกเอง · แก้ไขได้ในตั้งค่า")}
        />
        <StatCard
          label={t("Revenue this month", "รายได้เดือนนี้")}
          value={formatTHB(d.monthlyRevenueSatang)}
          icon={TrendingUp}
          tone="positive"
        />
        <StatCard
          label={t("Burn this month", "รายจ่ายเดือนนี้")}
          value={formatTHB(d.monthlyBurnSatang)}
          icon={Flame}
          tone="negative"
          hint={t(`Net burn ${formatTHB(d.netBurnSatang)}`, `รายจ่ายสุทธิ ${formatTHB(d.netBurnSatang)}`)}
        />
        <StatCard
          label={t("Runway", "ระยะเวลาเงินสำรอง")}
          value={runway.value}
          icon={Hourglass}
          tone={runway.tone}
          hint={runway.hint}
        />
        <StatCard
          label={t("Open pipeline", "ดีลที่รอปิด")}
          value={formatTHBWhole(d.pipelineSatang)}
          icon={Target}
          hint={t(`Weighted ${formatTHBWhole(d.weightedPipelineSatang)}`, `ถ่วงน้ำหนัก ${formatTHBWhole(d.weightedPipelineSatang)}`)}
        />
        <StatCard
          label={t("Open quotes", "ใบเสนอราคาที่รอผล")}
          value={formatTHBWhole(d.openQuotesValueSatang)}
          icon={FileText}
          hint={t(
            `${d.openQuotesCount} open quote${d.openQuotesCount === 1 ? "" : "s"}`,
            `รอผล ${d.openQuotesCount} ใบ`
          )}
        />
        <StatCard
          label="MRR"
          value={formatTHB(d.mrrSatang)}
          icon={Repeat}
          hint={t("Active subscriptions / month", "รายได้ประจำจากสมาชิก / เดือน")}
        />
        <StatCard
          label={t("Billable hours", "ชั่วโมงที่เรียกเก็บได้")}
          value={t(`${d.billableHoursThisMonth.toFixed(1)} h`, `${d.billableHoursThisMonth.toFixed(1)} ชม.`)}
          icon={Clock}
          hint={t(
            `${Math.round(d.utilizationThisMonth * 100)}% utilization · this month`,
            `ใช้เวลาทำงาน ${Math.round(d.utilizationThisMonth * 100)}% · เดือนนี้`
          )}
        />
        <StatCard
          label={t("Unpaid invoices", "ใบแจ้งหนี้ค้างชำระ")}
          value={formatTHB(d.unpaidSatang)}
          icon={FileWarning}
          tone={d.overdueInvoiceCount > 0 ? "warning" : "default"}
          hint={t(
            `${d.unpaidInvoiceCount} open · ${d.overdueInvoiceCount} overdue`,
            `ค้าง ${d.unpaidInvoiceCount} · เกินกำหนด ${d.overdueInvoiceCount}`
          )}
        />
        <StatCard
          label={t("Active projects", "โปรเจกต์ที่ดำเนินอยู่")}
          value={String(d.activeProjectCount)}
          icon={Briefcase}
          hint={t("In delivery or support", "กำลังทำหรือดูแลหลังส่งมอบ")}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="size-4" /> {t("Follow-ups due today", "งานติดตามที่ครบกำหนดวันนี้")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {d.followUpsDueToday.length === 0 ? (
              <EmptyState
                icon={CalendarClock}
                title={t("Nothing due today", "วันนี้ไม่มีงานครบกำหนด")}
                description={t("You're all caught up on follow-ups.", "คุณติดตามงานครบหมดแล้ว")}
                className="border-0 p-6"
              />
            ) : (
              <ul className="divide-y">
                {d.followUpsDueToday.map((f) => (
                  <li key={f.id} className="flex items-center gap-3 py-2.5 text-sm">
                    <Badge variant="outline" className="shrink-0 capitalize">
                      {enumLabel(t, "activity_type", f.type)}
                    </Badge>
                    <span className="truncate">{f.body ?? t("Follow up", "ติดตามผล")}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4" /> {t("Needs attention", "ต้องจัดการ")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-md border p-3 text-sm">
              <span>{t("Overdue invoices", "ใบแจ้งหนี้เกินกำหนด")}</span>
              <Badge variant={d.overdueInvoiceCount > 0 ? "destructive" : "secondary"}>
                {d.overdueInvoiceCount}
              </Badge>
            </div>
            <div className="rounded-md border">
              <div className="border-b px-3 py-2 text-sm font-medium">
                {t("Overdue follow-ups", "งานติดตามที่เลยกำหนด")} ({d.overdueFollowUps.length})
              </div>
              {d.overdueFollowUps.length === 0 ? (
                <p className="text-muted-foreground px-3 py-3 text-sm">{t("None — nice work.", "ไม่มีเลย เยี่ยมมาก")}</p>
              ) : (
                <ul className="divide-y">
                  {d.overdueFollowUps.slice(0, 5).map((f) => (
                    <li key={f.id} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                      <Badge variant="outline" className="shrink-0 capitalize">
                        {enumLabel(t, "activity_type", f.type)}
                      </Badge>
                      <span className="truncate">{f.body ?? t("Follow up", "ติดตามผล")}</span>
                      <span className="text-muted-foreground ml-auto shrink-0 text-xs">
                        {f.due_date}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
