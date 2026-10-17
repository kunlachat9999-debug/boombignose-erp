import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Download, ListPlus } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { requireOrgContext } from "@/lib/auth"
import { formatTHB } from "@/lib/money"
import { quoteIsEditable, serviceAmountBaht } from "@/lib/workflows/service"
import { todayISO } from "@/lib/dates"

import { PageHeader } from "@/components/page-header"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"

import { updateQuote } from "../actions"
import {
  QuoteForm,
  type QuoteFormValues,
  type QuoteFormSubmitValues,
} from "../_components/quote-form"
import { QuoteItemForm } from "../_components/quote-item-form"
import { DeleteQuoteItemButton } from "../_components/delete-quote-item-button"
import { QuoteStatusControls } from "../_components/quote-status-controls"
import { QuoteStatusBadge } from "../_components/quote-status-badge"
import { EmailQuoteButton } from "../_components/email-quote-button"
import type { Option } from "../_components/form-fields"
import { getT } from "@/lib/i18n-server"

export const dynamic = "force-dynamic"

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-muted-foreground text-xs font-medium">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  )
}

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const ctx = await requireOrgContext()
  const t = await getT()
  const supabase = await createClient()

  const [quoteRes, itemsRes, clientsRes, projectsRes] = await Promise.all([
    supabase
      .from("quotes")
      .select(
        "id, number, status, issue_date, valid_until, subtotal_satang, discount_satang, total_satang, notes, client_id, project_id, converted_invoice_id, clients(name)"
      ).eq("org_id", ctx.orgId)
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("quote_items")
      .select("id, description, quantity, unit_price_satang, amount_satang, position")
      .eq("org_id", ctx.orgId)
      .eq("quote_id", id)
      .order("position", { ascending: true }),
    supabase.from("clients").select("id, name").eq("org_id", ctx.orgId).order("name"),
    supabase.from("projects").select("id, name").eq("org_id", ctx.orgId).order("name"),
  ])

  const quote = quoteRes.data
  if (!quote) notFound()

  const { data: deliveryMilestones, error: milestoneError } = await supabase
    .from("milestones")
    .select("id, title, done, project_id")
    .eq("org_id", ctx.orgId)
    .eq("source_quote_id", quote.id)
    .order("created_at", { ascending: true })
  if (milestoneError) throw new Error(milestoneError.message)

  const items = itemsRes.data ?? []
  const canConvert = (ctx.role === "owner" || ctx.role === "admin") && (!quote.valid_until || quote.valid_until >= todayISO())
  const editable = quoteIsEditable(quote.status)
  const locked = !editable
  const linkedProject = (projectsRes.data ?? []).find((p) => p.id === quote.project_id)

  const clients: Option[] = (clientsRes.data ?? []).map((c) => ({
    value: c.id,
    label: c.name,
  }))
  const projects: Option[] = (projectsRes.data ?? []).map((p) => ({
    value: p.id,
    label: p.name,
  }))

  const defaultValues: QuoteFormValues = {
    client_id: quote.client_id,
    project_id: quote.project_id ?? "",
    number: quote.number,
    issue_date: quote.issue_date ?? "",
    valid_until: quote.valid_until ?? "",
    discountBaht: serviceAmountBaht(quote.discount_satang),
    notes: quote.notes ?? "",
  }

  // Bind the quote id into a real server action (see invoices/[id] for why a
  // plain closure can't cross the RSC boundary to a "use client" form).
  const quoteId = quote.id
  async function saveQuote(values: QuoteFormSubmitValues) {
    "use server"
    return updateQuote({ id: quoteId, ...values })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={quote.number}
        description={quote.clients?.name ?? t("Quote", "ใบเสนอราคา")}
      >
        <Button
          variant="outline"
          render={<a href={`/quotes/${quote.id}/pdf`} target="_blank" rel="noreferrer" />}
        >
          <Download /> {t("Download PDF", "ดาวน์โหลด PDF")}
        </Button>
        <EmailQuoteButton quoteId={quote.id} />
        <Button variant="outline" render={<Link href="/quotes" />}>
          <ArrowLeft /> {t("Back", "กลับ")}
        </Button>
      </PageHeader>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">{t("Overview", "ภาพรวม")}</CardTitle>
          <QuoteStatusBadge status={quote.status} />
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label={t("Subtotal", "ยอดก่อนส่วนลด")} value={formatTHB(quote.subtotal_satang)} />
            <Field label={t("Discount", "ส่วนลด")} value={formatTHB(quote.discount_satang)} />
            <Field
              label={t("Total", "ยอดรวม")}
              value={
                <span className="font-medium">{formatTHB(quote.total_satang)}</span>
              }
            />
            <Field label={t("Issue date", "วันที่ออก")} value={quote.issue_date ?? "—"} />
            <Field label={t("Valid until", "ใช้ได้ถึง")} value={quote.valid_until ?? "—"} />
            <Field label={t("Client", "ลูกค้า")} value={quote.clients?.name ?? "—"} />
            <Field label={t("Project", "โปรเจกต์")} value={linkedProject ? (
              <Link href={`/projects/${linkedProject.id}`} className="hover:underline">{linkedProject.name}</Link>
            ) : "—"} />
            {quote.converted_invoice_id ? (
              <Field
                label={t("Converted invoice", "ใบแจ้งหนี้ที่แปลงแล้ว")}
                value={
                  <Link
                    href={`/finance/invoices/${quote.converted_invoice_id}`}
                    className="hover:underline"
                  >
                    {t("View invoice", "ดูใบแจ้งหนี้")}
                  </Link>
                }
              />
            ) : null}
          </dl>

          {deliveryMilestones?.length ? (
            <Field label={t("Delivery milestones", "เป้าหมายการส่งมอบ")} value={
              <ul className="space-y-1">
                {deliveryMilestones.map((milestone) => (
                  <li key={milestone.id}>
                    <Link href={`/projects/${milestone.project_id}#milestone-${milestone.id}`} className="hover:underline">
                      {milestone.title} · {milestone.done ? t("Done", "เสร็จแล้ว") : t("Pending", "รอดำเนินการ")}
                    </Link>
                  </li>
                ))}
              </ul>
            } />
          ) : null}

          {quote.notes ? (
            <>
              <Separator />
              <Field label={t("Notes", "หมายเหตุ")} value={quote.notes} />
            </>
          ) : null}

          <Separator />
          <QuoteStatusControls
            quoteId={quote.id}
            orgId={ctx.orgId}
            status={quote.status}
            canConvert={canConvert}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("Line items", "รายการ")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {items.length === 0 ? (
            <EmptyState
              icon={ListPlus}
              title={t("No line items yet", "ยังไม่มีรายการ")}
              description={t("Add items below to build up this quote's total.", "เพิ่มรายการด้านล่างเพื่อคำนวณยอดรวมของใบเสนอราคา")}
              className="border-0"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Description", "รายละเอียด")}</TableHead>
                  <TableHead className="text-right">{t("Qty", "จำนวน")}</TableHead>
                  <TableHead className="text-right">{t("Unit price", "ราคาต่อหน่วย")}</TableHead>
                  <TableHead className="text-right">{t("Amount", "จำนวนเงิน")}</TableHead>
                  {locked ? null : (
                    <TableHead className="w-10" aria-label={t("Actions", "การดำเนินการ")} />
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((it) => (
                  <TableRow key={it.id}>
                    <TableCell className="font-medium">{it.description}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {Number(it.quantity)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatTHB(it.unit_price_satang)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatTHB(it.amount_satang)}
                    </TableCell>
                    {locked ? null : (
                      <TableCell className="text-right">
                        <DeleteQuoteItemButton id={it.id} label={it.description} />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <Separator />
          {locked ? (
            <p className="text-muted-foreground text-sm">{quote.status === "accepted"
                ? t("Accepted scope is locked.", "ขอบเขตงานที่อนุมัติแล้วถูกล็อก")
                : t("This quote is locked.", "ใบเสนอราคานี้ถูกล็อก")}</p>
          ) : (
            <QuoteItemForm quoteId={quote.id} />
          )}
        </CardContent>
      </Card>

      {editable ? (
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle className="text-base">{t("Edit quote", "แก้ไขใบเสนอราคา")}</CardTitle>
          </CardHeader>
          <CardContent>
            <QuoteForm
              clients={clients}
              projects={projects}
              defaultValues={defaultValues}
              submitLabel={t("Save changes", "บันทึกการเปลี่ยนแปลง")}
              action={saveQuote}
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
