import Link from "next/link"
import { TrendingUp, Timer, Printer, BarChart3, Clock } from "lucide-react"

import { formatTHB } from "@/lib/money"
import { getReportData } from "./_data"

import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { getT } from "@/lib/i18n-server"

export const dynamic = "force-dynamic"

/** Hours with two decimals, e.g. 3.5 → "3.50". */
function fmtHours(hours: number): string {
  return hours.toFixed(2)
}

export default async function ReportsPage() {
  const { months, rangeLabel, revenue, hours, totalRevenueSatang } =
    await getReportData()
  const t = await getT()
  // _data.ts uses fixed English fallbacks for rows without a client/project.
  const rowName = (name: string) =>
    name === "Unassigned"
      ? t("Unassigned", "ไม่ระบุลูกค้า")
      : name === "No project"
        ? t("No project", "ไม่ระบุโปรเจกต์")
        : name

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Reports", "รายงาน")}
        description={t(`Operational reports · ${rangeLabel}`, `รายงานการดำเนินงาน · ${rangeLabel}`)}
      >
        <Button
          variant="outline"
          render={
            <Link href="/reports/print" target="_blank" rel="noopener" />
          }
        >
          <Printer /> {t("Print / PDF", "พิมพ์ / PDF")}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard
          label={t("Verified cash received", "เงินเข้าที่ตรวจสอบแล้ว")}
          value={formatTHB(totalRevenueSatang)}
          icon={TrendingUp}
          tone="positive"
          hint={t("Verified receipts in range · Bangkok month", "ยอดรับชำระที่ตรวจสอบแล้วในช่วงเวลา · ตามเดือนเวลากรุงเทพฯ")}
        />
        <StatCard
          label={t("Billable hours", "ชั่วโมงที่เรียกเก็บได้")}
          value={fmtHours(hours.billableHours)}
          icon={Timer}
          hint={t("Logged & billable in range", "บันทึกและเรียกเก็บได้ในช่วงเวลา")}
        />
        <StatCard
          label={t("Total hours", "ชั่วโมงรวม")}
          value={fmtHours(hours.totalHours)}
          icon={Clock}
          hint={t("All time logged in range", "เวลาทั้งหมดที่บันทึกในช่วงเวลา")}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("Verified cash by client × month", "เงินเข้าที่ตรวจสอบแล้ว แยกตามลูกค้า × เดือน")}</CardTitle>
        </CardHeader>
        <CardContent>
          {revenue.rowKeys.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title={t("No payments in range", "ไม่มีการชำระเงินในช่วงเวลานี้")}
              description={t("Only verified receipts appear here by client and month.", "แสดงเฉพาะยอดที่ตรวจสอบแล้ว แยกตามลูกค้าและเดือน")}
              className="border-0"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Client", "ลูกค้า")}</TableHead>
                  {months.map((m) => (
                    <TableHead key={m} className="text-right">
                      {m}
                    </TableHead>
                  ))}
                  <TableHead className="text-right">{t("Total", "รวม")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revenue.rowKeys.map((client) => (
                  <TableRow key={client}>
                    <TableCell className="font-medium">{rowName(client)}</TableCell>
                    {months.map((m) => (
                      <TableCell
                        key={m}
                        className="text-right tabular-nums"
                      >
                        {formatTHB(revenue.cell(client, m))}
                      </TableCell>
                    ))}
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatTHB(revenue.rowTotal(client))}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="border-t-2">
                  <TableCell className="font-semibold">{t("Total", "รวม")}</TableCell>
                  {months.map((m) => (
                    <TableCell
                      key={m}
                      className="text-right font-semibold tabular-nums"
                    >
                      {formatTHB(revenue.colTotal(m))}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-semibold tabular-nums">
                    {formatTHB(revenue.grandTotal)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("Hours by project", "ชั่วโมงแยกตามโปรเจกต์")}</CardTitle>
        </CardHeader>
        <CardContent>
          {hours.projects.length === 0 ? (
            <EmptyState
              icon={Timer}
              title={t("No time logged in range", "ไม่มีการบันทึกเวลาในช่วงนี้")}
              description={t("Logged time entries will roll up here by project.", "เวลาที่บันทึกจะสรุปรวมที่นี่ตามโปรเจกต์")}
              className="border-0"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Project", "โปรเจกต์")}</TableHead>
                  <TableHead className="text-right">{t("Total hours", "ชั่วโมงรวม")}</TableHead>
                  <TableHead className="text-right">{t("Billable hours", "ชั่วโมงที่เรียกเก็บได้")}</TableHead>
                  <TableHead className="text-right">{t("Non-billable", "ไม่เรียกเก็บ")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hours.projects.map((p) => (
                  <TableRow key={p.project_name}>
                    <TableCell className="font-medium">
                      {rowName(p.project_name)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmtHours(p.totalHours)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmtHours(p.billableHours)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmtHours(p.totalHours - p.billableHours)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="border-t-2">
                  <TableCell className="font-semibold">{t("Total", "รวม")}</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {fmtHours(hours.totalHours)}
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {fmtHours(hours.billableHours)}
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {fmtHours(hours.totalHours - hours.billableHours)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
