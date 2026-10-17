import Link from "next/link"
import { ArrowLeft, Repeat, Plus } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { requireOrgContext } from "@/lib/auth"
import { formatTHB } from "@/lib/money"

import { PageHeader } from "@/components/page-header"
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

import { SubscriptionStatusBadge } from "../_components/subscription-status-badge"
import { enumLabel } from "@/lib/enum-labels"
import { getT } from "@/lib/i18n-server"

export const dynamic = "force-dynamic"

export default async function SubscriptionsPage() {
  const ctx = await requireOrgContext()
  const t = await getT()
  const supabase = await createClient()

  const { data: subs } = await supabase
    .from("subscriptions")
    .select(
      "id, name, amount_satang, interval, status, next_run_date, clients(name)"
    )
    .eq("org_id", ctx.orgId)
    .order("created_at", { ascending: false })

  const subscriptions = subs ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Subscriptions", "รายการสมัครสมาชิก")}
        description={t("Recurring invoices that bill clients on a schedule.", "ใบแจ้งหนี้ประจำที่เรียกเก็บเงินลูกค้าตามรอบ")}
      >
        <Button variant="outline" render={<Link href="/finance" />}>
          <ArrowLeft /> {t("Back", "กลับ")}
        </Button>
        <Button render={<Link href="/finance/subscriptions/new" />}>
          <Plus /> {t("New subscription", "เพิ่มรายการสมัครสมาชิก")}
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("All subscriptions", "รายการสมัครสมาชิกทั้งหมด")}</CardTitle>
          <p className="text-muted-foreground text-sm">
            {t(
              "Active subscriptions feed the MRR metric on the Finance dashboard.",
              "รายการที่ใช้งานอยู่จะนำไปคำนวณรายได้ประจำต่อเดือน (MRR) ในหน้าการเงิน"
            )}
          </p>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <EmptyState
              icon={Repeat}
              title={t("No subscriptions yet", "ยังไม่มีรายการสมัครสมาชิก")}
              description={t(
                "Create a subscription to bill a client automatically on a recurring schedule.",
                "สร้างรายการเพื่อเรียกเก็บเงินลูกค้าอัตโนมัติตามรอบ"
              )}
              action={
                <Button render={<Link href="/finance/subscriptions/new" />}>
                  <Plus /> {t("New subscription", "เพิ่มรายการสมัครสมาชิก")}
                </Button>
              }
              className="border-0"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Name", "ชื่อ")}</TableHead>
                  <TableHead>{t("Client", "ลูกค้า")}</TableHead>
                  <TableHead>{t("Interval", "รอบ")}</TableHead>
                  <TableHead>{t("Status", "สถานะ")}</TableHead>
                  <TableHead className="text-right">{t("Amount", "จำนวนเงิน")}</TableHead>
                  <TableHead>{t("Next run", "รอบถัดไป")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/finance/subscriptions/${s.id}`}
                        className="hover:underline"
                      >
                        {s.name}
                      </Link>
                    </TableCell>
                    <TableCell>{s.clients?.name ?? "—"}</TableCell>
                    <TableCell>{enumLabel(t, "recurring_interval", s.interval)}</TableCell>
                    <TableCell>
                      <SubscriptionStatusBadge status={s.status} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatTHB(s.amount_satang)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {s.next_run_date}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
