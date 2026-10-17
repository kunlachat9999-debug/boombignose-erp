import Link from "next/link"
import {
  FileWarning,
  TrendingUp,
  Flame,
  Repeat,
  FilePlus2,
  ReceiptText,
  Receipt,
  Coins,
} from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { requireOrgContext } from "@/lib/auth"
import { currentMonthKey, todayISO } from "@/lib/dates"
import { formatTHB, sumSatang } from "@/lib/money"
import {
  revenueForMonth,
  costsForMonth,
  subscriptionMrr,
  unpaidTotal,
  unpaidCount,
} from "@/lib/metrics/finance"
import {
  deriveInvoiceStatus,
  outstandingSatang,
} from "@/lib/metrics/invoice-status"

import { Constants } from "@/lib/types/database"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { EmptyState } from "@/components/empty-state"
import { InvoiceStatusBadge } from "@/components/status-badge"
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

import { DeleteCostButton } from "./_components/delete-cost-button"
import { FinanceToolbar } from "./_components/finance-toolbar"
import type { SavedView } from "@/app/(app)/views/saved-views-menu"
import type { ViewConfig } from "@/app/(app)/views/view-config"
import { enumLabel } from "@/lib/enum-labels"
import { getT } from "@/lib/i18n-server"

export const dynamic = "force-dynamic"

const INVOICE_STATUSES = Constants.public.Enums.invoice_status

/** Pull the known filter keys out of a saved-view config row. */
function toViewConfig(config: unknown): ViewConfig {
  const c = (config ?? {}) as Record<string, unknown>
  return typeof c.status === "string" ? { status: c.status } : {}
}

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const ctx = await requireOrgContext()
  const t = await getT()
  const supabase = await createClient()
  const month = currentMonthKey()
  const today = todayISO()

  const { status: statusParam } = await searchParams
  const status = (INVOICE_STATUSES as readonly string[]).includes(
    statusParam ?? ""
  )
    ? statusParam!
    : ""

  const [invoicesRes, paymentsRes, costsRes, viewsRes, subscriptionsRes] =
    await Promise.all([
      supabase
        .from("invoices")
        .select(
          "id, number, amount_satang, status, due_date, issue_date, is_recurring, recurring_interval, client_id, clients(name)"
        )
        .eq("org_id", ctx.orgId)
        .order("issue_date", { ascending: false }),
      supabase.from("payments").select("invoice_id, amount_satang, paid_at").eq("verification_state", "verified").eq("org_id", ctx.orgId),
      supabase
        .from("costs")
        .select(
          "id, category, amount_satang, incurred_on, vendor, project_id, projects(name)"
        )
        .eq("org_id", ctx.orgId)
        .order("incurred_on", { ascending: false }),
      supabase
        .from("saved_views")
        .select("id, name, config")
        .eq("org_id", ctx.orgId)
        .eq("module", "finance")
        .eq("user_id", ctx.userId)
        .order("created_at", { ascending: true }),
      supabase
        .from("subscriptions")
        .select("status, amount_satang, interval")
        .eq("org_id", ctx.orgId)
        .eq("status", "active"),
    ])

  if (invoicesRes.error || paymentsRes.error || costsRes.error || viewsRes.error || subscriptionsRes.error) throw new Error("Finance data unavailable. Reload before relying on totals.")
  const invoices = invoicesRes.data ?? []
  const payments = paymentsRes.data ?? []
  const costs = costsRes.data ?? []
  const activeSubscriptions = subscriptionsRes.data ?? []

  const savedViews: SavedView[] = (viewsRes.data ?? []).map((v) => ({
    id: v.id,
    name: v.name,
    config: toViewConfig(v.config),
  }))

  // Sum payments per invoice.
  const paidByInvoice = new Map<string, number>()
  for (const p of payments) {
    paidByInvoice.set(
      p.invoice_id,
      sumSatang([paidByInvoice.get(p.invoice_id) ?? 0, p.amount_satang])
    )
  }

  const invoiceRows = invoices.map((inv) => {
    const paid = paidByInvoice.get(inv.id) ?? 0
    return {
      ...inv,
      paid_satang: paid,
      outstanding: outstandingSatang(inv.amount_satang, paid),
      effectiveStatus: deriveInvoiceStatus(inv, paid, today),
    }
  })

  // Status filter uses the same verified-receipt effective status as the export.
  const filteredInvoiceRows = status
    ? invoiceRows.filter((inv) => inv.effectiveStatus === status)
    : invoiceRows

  // Metrics.
  const invoicesWithPaid = invoices.map((inv) => ({
    status: inv.status,
    amount_satang: inv.amount_satang,
    paid_satang: paidByInvoice.get(inv.id) ?? 0,
  }))
  const unpaidSatang = unpaidTotal(invoicesWithPaid)
  const openCount = unpaidCount(invoicesWithPaid)
  const revenueSatang = revenueForMonth(payments, month)
  const costsSatang = costsForMonth(costs, month)
  // MRR is derived from active subscriptions (source of truth) for consistency
  // with the dashboard.
  const mrrSatang = subscriptionMrr(activeSubscriptions)

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Finance", "การเงิน")}
        description={t(
          "Verified receipts, receivables, and recorded operating costs.",
          "รายรับที่ตรวจสอบแล้ว ลูกหนี้ค้างชำระ และค่าใช้จ่ายดำเนินงาน"
        )}
      >
        <Button variant="outline" render={<Link href="/finance/business-profile" />}>{t("Business profile", "ข้อมูลกิจการ")}</Button>
        <Button variant="outline" render={<Link href="/finance/subscriptions" />}>
          <Repeat /> {t("Subscriptions", "รายการสมัครสมาชิก")}
        </Button>
        <Button variant="outline" render={<Link href="/finance/payments/export" />}>{t("Receipt evidence CSV", "CSV หลักฐานการรับเงิน")}</Button>
        <Button variant="outline" render={<Link href="/finance/costs/new" />}>
          <Coins /> {t("New cost", "เพิ่มค่าใช้จ่าย")}
        </Button>
        <Button render={<Link href="/finance/invoices/new" />}>
          <FilePlus2 /> {t("New invoice", "สร้างใบแจ้งหนี้")}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label={t("Unpaid total", "ยอดค้างชำระ")}
          value={formatTHB(unpaidSatang)}
          icon={FileWarning}
          tone={openCount > 0 ? "warning" : "default"}
          hint={t(`${openCount} open invoice${openCount === 1 ? "" : "s"}`, `ค้างชำระ ${openCount} ใบ`)}
        />
        <StatCard
          label={t("Verified cash this month", "เงินเข้าที่ตรวจสอบแล้วเดือนนี้")}
          value={formatTHB(revenueSatang)}
          icon={TrendingUp}
          tone="positive"
          hint={t("Payments received", "ยอดที่ได้รับชำระ")}
        />
        <StatCard
          label={t("Costs this month", "ค่าใช้จ่ายเดือนนี้")}
          value={formatTHB(costsSatang)}
          icon={Flame}
          tone="negative"
          hint={t("Costs incurred", "ค่าใช้จ่ายที่เกิดขึ้น")}
        />
        <StatCard
          label={t("Monthly recurring forecast", "ประมาณการรายได้ประจำต่อเดือน")}
          value={formatTHB(mrrSatang)}
          icon={Repeat}
          hint={t("Recurring revenue / month", "รายได้ประจำ / เดือน")}
        />
      </div>

      <FinanceToolbar status={status} savedViews={savedViews} />

      <Tabs defaultValue="invoices" className="gap-4">
        <TabsList>
          <TabsTrigger value="invoices">
            <ReceiptText /> {t("Invoices", "ใบแจ้งหนี้")}
          </TabsTrigger>
          <TabsTrigger value="costs">
            <Receipt /> {t("Costs", "ค่าใช้จ่าย")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("Invoices", "ใบแจ้งหนี้")}</CardTitle>
            </CardHeader>
            <CardContent>
              {invoiceRows.length === 0 ? (
                <EmptyState
                  icon={ReceiptText}
                  title={t("No invoices yet", "ยังไม่มีใบแจ้งหนี้")}
                  description={t("Create your first invoice to start tracking what clients owe.", "สร้างใบแจ้งหนี้แรกเพื่อเริ่มติดตามยอดที่ลูกค้าค้างชำระ")}
                  action={
                    <Button render={<Link href="/finance/invoices/new" />}>
                      <FilePlus2 /> {t("New invoice", "สร้างใบแจ้งหนี้")}
                    </Button>
                  }
                  className="border-0"
                />
              ) : filteredInvoiceRows.length === 0 ? (
                <EmptyState
                  icon={ReceiptText}
                  title={t("No matching invoices", "ไม่พบใบแจ้งหนี้ที่ค้นหา")}
                  description={t("No invoices match the selected status.", "ไม่มีใบแจ้งหนี้ในสถานะที่เลือก")}
                  className="border-0"
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("Number", "เลขที่")}</TableHead>
                      <TableHead>{t("Client", "ลูกค้า")}</TableHead>
                      <TableHead>{t("Status", "สถานะ")}</TableHead>
                      <TableHead className="text-right">{t("Amount", "จำนวนเงิน")}</TableHead>
                      <TableHead>{t("Due", "ครบกำหนด")}</TableHead>
                      <TableHead className="text-right">{t("Outstanding", "ค้างชำระ")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoiceRows.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/finance/invoices/${inv.id}`}
                            className="hover:underline"
                          >
                            {inv.number}
                          </Link>
                          {inv.is_recurring ? (
                            <Repeat
                              className="text-muted-foreground ml-1.5 inline size-3.5 align-text-bottom"
                              aria-label={t("Recurring", "ออกประจำ")}
                            />
                          ) : null}
                        </TableCell>
                        <TableCell>{inv.clients?.name ?? "—"}</TableCell>
                        <TableCell>
                          <InvoiceStatusBadge status={inv.effectiveStatus} />
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatTHB(inv.amount_satang)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {inv.due_date ?? "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {inv.outstanding > 0
                            ? formatTHB(inv.outstanding)
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("Costs", "ค่าใช้จ่าย")}</CardTitle>
            </CardHeader>
            <CardContent>
              {costs.length === 0 ? (
                <EmptyState
                  icon={Receipt}
                  title={t("No costs logged", "ยังไม่มีค่าใช้จ่าย")}
                  description={t("Track software, contractors, and other operating costs here.", "บันทึกค่าซอฟต์แวร์ ผู้รับจ้าง และค่าใช้จ่ายดำเนินงานอื่น ๆ ที่นี่")}
                  action={
                    <Button render={<Link href="/finance/costs/new" />}>
                      <Coins /> {t("New cost", "เพิ่มค่าใช้จ่าย")}
                    </Button>
                  }
                  className="border-0"
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("Category", "หมวดหมู่")}</TableHead>
                      <TableHead className="text-right">{t("Amount", "จำนวนเงิน")}</TableHead>
                      <TableHead>{t("Date", "วันที่")}</TableHead>
                      <TableHead>{t("Vendor", "ผู้ขาย")}</TableHead>
                      <TableHead>{t("Project", "โปรเจกต์")}</TableHead>
                      <TableHead className="w-10" aria-label={t("Actions", "การดำเนินการ")} />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {costs.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">
                          {enumLabel(t, "cost_category", c.category)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatTHB(c.amount_satang)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {c.incurred_on}
                        </TableCell>
                        <TableCell>{c.vendor ?? "—"}</TableCell>
                        <TableCell>{c.projects?.name ?? "—"}</TableCell>
                        <TableCell className="text-right">
                          <DeleteCostButton
                            id={c.id}
                            label={t(
                              `${enumLabel(t, "cost_category", c.category)} cost`,
                              `ค่าใช้จ่าย${enumLabel(t, "cost_category", c.category)}`
                            )}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
