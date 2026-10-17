import Link from "next/link"
import { FileText, FilePlus2 } from "lucide-react"

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

import { QuoteStatusBadge } from "./_components/quote-status-badge"
import { getT } from "@/lib/i18n-server"

export const dynamic = "force-dynamic"

export default async function QuotesPage() {
  const ctx = await requireOrgContext()
  const t = await getT()
  const supabase = await createClient()

  const { data } = await supabase
    .from("quotes")
    .select(
      "id, number, status, total_satang, valid_until, issue_date, clients(name)"
    ).eq("org_id", ctx.orgId)
    .order("issue_date", { ascending: false })

  const quotes = data ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Quotes", "ใบเสนอราคา")}
        description={t(
          "Draft proposals, track acceptance, and convert to invoices.",
          "ร่างใบเสนอราคา ติดตามการอนุมัติ และแปลงเป็นใบแจ้งหนี้"
        )}
      >
        <Button render={<Link href="/quotes/new" />}>
          <FilePlus2 /> {t("New quote", "สร้างใบเสนอราคา")}
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("Quotes", "ใบเสนอราคา")}</CardTitle>
        </CardHeader>
        <CardContent>
          {quotes.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={t("No quotes yet", "ยังไม่มีใบเสนอราคา")}
              description={t("Create your first quote to send a proposal to a client.", "สร้างใบเสนอราคาแรกเพื่อส่งข้อเสนอให้ลูกค้า")}
              action={
                <Button render={<Link href="/quotes/new" />}>
                  <FilePlus2 /> {t("New quote", "สร้างใบเสนอราคา")}
                </Button>
              }
              className="border-0"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Number", "เลขที่")}</TableHead>
                  <TableHead>{t("Client", "ลูกค้า")}</TableHead>
                  <TableHead>{t("Status", "สถานะ")}</TableHead>
                  <TableHead className="text-right">{t("Total", "ยอดรวม")}</TableHead>
                  <TableHead>{t("Valid until", "ใช้ได้ถึง")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/quotes/${q.id}`}
                        className="hover:underline"
                      >
                        {q.number}
                      </Link>
                    </TableCell>
                    <TableCell>{q.clients?.name ?? "—"}</TableCell>
                    <TableCell>
                      <QuoteStatusBadge status={q.status} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatTHB(q.total_satang)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {q.valid_until ?? "—"}
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
