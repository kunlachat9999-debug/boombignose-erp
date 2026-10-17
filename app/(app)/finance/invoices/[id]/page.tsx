import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, FileText, PlugZap, Wallet } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { requireOrgContext } from "@/lib/auth"
import { todayISO } from "@/lib/dates"
import { formatTHB, satangToBahtString, sumSatang } from "@/lib/money"
import {
  deriveInvoiceStatus,
  outstandingSatang,
} from "@/lib/metrics/invoice-status"
import type { Enums } from "@/lib/types/database"

import { PageHeader } from "@/components/page-header"
import { EmptyState } from "@/components/empty-state"
import { InvoiceStatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"

import { updateInvoice } from "../../actions"
import { addInvoiceItem, deleteInvoiceItem } from "../../invoice-items-actions"
import {
  InvoiceForm,
  type InvoiceFormValues,
  type InvoiceFormSubmitValues,
} from "../../_components/invoice-form"
import {
  InvoiceItemsEditor,
  type InvoiceItemRow,
} from "../../_components/invoice-items-editor"
import { IssueInvoiceForm } from "../../_components/issue-invoice-form"
import { PaymentForm } from "../../_components/payment-form"
import { ReviewClaimForm } from "../../_components/review-claim-form"
import { SyncInvoiceButton } from "../../_components/sync-invoice-button"
import { EmailInvoiceButton } from "../../_components/email-invoice-button"
import type { Option } from "../../_components/form-fields"
import { enumLabel } from "@/lib/enum-labels"
import type { T } from "@/lib/i18n"
import { getT } from "@/lib/i18n-server"

export const dynamic = "force-dynamic"

const ACCOUNTING_PROVIDER_LABEL: Record<Enums<"accounting_provider">, string> = {
  flowaccount: "FlowAccount",
  peak: "PEAK",
  xero: "Xero",
}

function claimStatusLabel(t: T, status: string): string {
  if (status === "pending") return t("Pending", "รอตรวจสอบ")
  if (status === "verified") return t("Verified", "ตรวจสอบแล้ว")
  if (status === "rejected") return t("Rejected", "ปฏิเสธ")
  return status
}

function verificationLabel(t: T, state: string): string {
  if (state === "legacy_unverified") return t("Legacy · unverified", "ยอดเดิม · ยังไม่ตรวจสอบ")
  if (state === "legacy_reconciled") return t("Legacy · reconciled", "ยอดเดิม · กระทบยอดแล้ว")
  if (state === "verified") return t("Verified", "ตรวจสอบแล้ว")
  return state
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-muted-foreground text-xs font-medium">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  )
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const ctx = await requireOrgContext()
  const t = await getT()
  const supabase = await createClient()
  const today = todayISO()

  const [
    claimsRes,
    legacyRes,
    invoiceRes,
    itemsRes,
    paymentsRes,
    clientsRes,
    projectsRes,
    connRes,
    syncRes,
  ] = await Promise.all([
    supabase.from("payment_claims").select("id, amount_satang, reference, status").eq("org_id", ctx.orgId).eq("invoice_id",id).order("created_at"),
    supabase.from("payments").select("id, amount_satang, notes, paid_at, method, verification_state, reconciled_payment_id").eq("org_id", ctx.orgId).neq("verification_state","verified").eq("invoice_id",id),
    supabase
      .from("invoices")
      .select(
        "id, number, amount_satang, status, issue_date, due_date, is_recurring, recurring_interval, notes, client_id, project_id, discount_satang, source_quote_id, source_milestone_id, version, issued_snapshot_id, clients(name), projects(name)"
      ).eq("org_id", ctx.orgId)
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("invoice_items")
      .select("id, description, quantity, unit_price_satang, amount_satang").eq("org_id", ctx.orgId)
      .eq("invoice_id", id)
      .order("position", { ascending: true }),
    supabase
      .from("payments")
      .select("id, amount_satang, paid_at, method, notes").eq("verification_state", "verified").eq("org_id", ctx.orgId)
      .eq("invoice_id", id)
      .order("paid_at", { ascending: false }),
    supabase.from("clients").select("id, name").eq("org_id", ctx.orgId).order("name"),
    supabase.from("projects").select("id, name").eq("org_id", ctx.orgId).order("name"),
    supabase
      .from("accounting_connections")
      .select("provider, status").eq("org_id", ctx.orgId)
      .maybeSingle(),
    // One sync-map row exists PER PROVIDER (the unique key includes provider),
    // so after a provider switch there can be several rows for this invoice.
    // Take the most recently synced rather than assuming a single row.
    supabase
      .from("accounting_sync_map")
      .select("external_id, provider, status, last_synced_at").eq("org_id", ctx.orgId)
      .eq("local_entity", "invoice")
      .eq("local_id", id)
      .order("last_synced_at", { ascending: false, nullsFirst: false })
      .limit(1),
  ])

  const invoice = invoiceRes.data
  if (!invoice) notFound()

  const payments = paymentsRes.data ?? []
  if (paymentsRes.error || itemsRes.error || legacyRes.error) throw new Error("Invoice evidence unavailable. Reload before making financial changes.")
  const paid = sumSatang(payments.map(p => p.amount_satang))
  const outstanding = outstandingSatang(invoice.amount_satang, paid)
  const effectiveStatus = deriveInvoiceStatus(invoice, paid, today)

  const accountingConnected = connRes.data?.status === "connected"
  const sync = syncRes.data?.[0] ?? null

  const clients: Option[] = (clientsRes.data ?? []).map((c) => ({
    value: c.id,
    label: c.name,
  }))
  const projects: Option[] = (projectsRes.data ?? []).map((p) => ({
    value: p.id,
    label: p.name,
  }))

  const defaultValues: InvoiceFormValues = {
    client_id: invoice.client_id,
    project_id: invoice.project_id ?? "",
    number: invoice.number,
    status: invoice.status,
    issue_date: invoice.issue_date ?? "",
    due_date: invoice.due_date ?? "",
    amountBaht: satangToBahtString(invoice.amount_satang),
    is_recurring: invoice.is_recurring,
    recurring_interval: invoice.recurring_interval ?? undefined,
    notes: invoice.notes ?? "",
  }

  // Bind the invoice id into a real server action. The "use client" InvoiceForm
  // can't receive a plain closure across the RSC boundary — it must be a server
  // action reference (like the /new page passes `createInvoice` directly).
  // Capture the narrowed id in a const so the closure doesn't see `invoice` as
  // possibly-null (control-flow narrowing doesn't cross into nested functions).
  const invoiceId = invoice.id
  async function saveInvoice(values: InvoiceFormSubmitValues) {
    "use server"
    return updateInvoice({ id: invoiceId, ...values })
  }

  const itemRows: InvoiceItemRow[] = (itemsRes.data ?? []).map((it) => ({
    id: it.id,
    description: it.description,
    quantity: String(Number(it.quantity)),
    unitPrice: formatTHB(it.unit_price_satang),
    amount: formatTHB(it.amount_satang),
  }))

  async function removeInvoiceItem(input: { id: string }) {
    "use server"
    return deleteInvoiceItem(input)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={invoice.number}
        description={invoice.clients?.name ?? t("Invoice", "ใบแจ้งหนี้")}
      >
        {accountingConnected ? (
          <SyncInvoiceButton invoiceId={invoice.id} />
        ) : (
          <Button variant="outline" size="sm" render={<Link href="/settings/accounting" />}>
            <PlugZap /> {t("Connect accounting", "เชื่อมต่อระบบบัญชี")}
          </Button>
        )}
        <Button
          variant="outline"
          render={
            <Link
              href={`/finance/invoices/${invoice.id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
            />
          }
        >
          <FileText /> {t("Print / PDF", "พิมพ์ / PDF")}
        </Button>
        <EmailInvoiceButton invoiceId={invoice.id} />
        <Button variant="outline" render={<Link href="/finance" />}>
          <ArrowLeft /> {t("Back", "กลับ")}
        </Button>
      </PageHeader>

      <p className="text-sm text-muted-foreground">
        {t(
          "Operational records. Tax classification, credits and withholding require accountant-approved evidence. ",
          "เอกสารเพื่อการดำเนินงาน การจัดประเภทภาษี การลดหนี้ และภาษีหัก ณ ที่จ่าย ต้องมีหลักฐานที่นักบัญชีรับรอง "
        )}
        <Link className="underline" href="/finance/business-profile">{t("Business profile", "ข้อมูลกิจการ")}</Link>
      </p>
      {invoice.status === "draft" && ctx.role !== "member" ? <Card><CardHeader><CardTitle className="text-base">{t("Issue invoice", "ออกใบแจ้งหนี้")}</CardTitle></CardHeader><CardContent><IssueInvoiceForm orgId={ctx.orgId} invoiceId={invoice.id} version={invoice.version} /></CardContent></Card> : null}
      {invoice.issued_snapshot_id ? <p className="text-sm">{t("Issued snapshot retained. Corrections must preserve the original document.", "เก็บสำเนาเอกสารที่ออกแล้ว การแก้ไขต้องคงเอกสารต้นฉบับไว้")}</p> : invoice.status !== "draft" ? <p role="alert" className="text-sm">{t("This legacy record has no issued snapshot. Review it before treating the printable record as an issued document.", "รายการเดิมนี้ไม่มีสำเนาเอกสารที่ออก กรุณาตรวจสอบก่อนถือว่าเอกสารที่พิมพ์ได้เป็นเอกสารที่ออกแล้ว")}</p> : null}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">{t("Overview", "ภาพรวม")}</CardTitle>
              <InvoiceStatusBadge status={effectiveStatus} />
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Field label={t("Amount", "จำนวนเงิน")} value={formatTHB(invoice.amount_satang)} />
                <Field label={t("Verified receipts", "รับชำระที่ตรวจสอบแล้ว")} value={formatTHB(paid)} />
                <Field
                  label={t("Outstanding", "ค้างชำระ")}
                  value={
                    <span className={outstanding > 0 ? "font-medium" : ""}>
                      {formatTHB(outstanding)}
                    </span>
                  }
                />
                <Field label={t("Discount", "ส่วนลด")} value={formatTHB(invoice.discount_satang)} />
                <Field label={t("Issue date", "วันที่ออก")} value={invoice.issue_date ?? "—"} />
                <Field label={t("Due date", "วันครบกำหนด")} value={invoice.due_date ?? "—"} />
                <Field
                  label={t("Client", "ลูกค้า")}
                  value={invoice.clients?.name ?? "—"}
                />
                <Field
                  label={t("Project", "โปรเจกต์")}
                  value={invoice.projects?.name ?? "—"}
                />
                <Field
                  label={t("Recurring", "ออกประจำ")}
                  value={
                    invoice.is_recurring
                      ? `${t("Yes", "ใช่")} · ${invoice.recurring_interval ? enumLabel(t, "recurring_interval", invoice.recurring_interval) : "—"}`
                      : t("No", "ไม่ใช่")
                  }
                />
                <Field
                  label={t("Stored status", "สถานะที่บันทึก")}
                  value={<InvoiceStatusBadge status={invoice.status} />}
                />
                <Field
                  label={t("Accounting sync", "ซิงก์ระบบบัญชี")}
                  value={
                    sync?.external_id ? (
                      <span className="space-y-0.5">
                        <span className="block font-medium">
                          {ACCOUNTING_PROVIDER_LABEL[sync.provider]} ·{" "}
                          {sync.external_id}
                        </span>
                        {sync.last_synced_at ? (
                          <span className="text-muted-foreground block text-xs">
                            {t("Synced ", "ซิงก์เมื่อ ")}
                            {sync.last_synced_at.slice(0, 10)}
                          </span>
                        ) : null}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">{t("Not synced", "ยังไม่ซิงก์")}</span>
                    )
                  }
                />
              </dl>
              {invoice.source_quote_id ? <p className="mt-4 text-sm">
                  {t(
                    "Accepted quote terms are authoritative. Linked corrections are needed for changes. Source quote: ",
                    "เงื่อนไขในใบเสนอราคาที่อนุมัติแล้วถือเป็นหลัก การเปลี่ยนแปลงต้องทำผ่านเอกสารแก้ไขที่ผูกกัน ใบเสนอราคาต้นทาง: "
                  )}
                  <Link className="underline" href={`/quotes/${invoice.source_quote_id}`}>
                    {t("View accepted quote", "ดูใบเสนอราคาที่อนุมัติ")}
                  </Link>
                </p> : null}
              {invoice.source_milestone_id && invoice.project_id ? <p className="text-sm">
                  {t("Delivery milestone: ", "เป้าหมายการส่งมอบ: ")}
                  <Link className="underline" href={`/projects/${invoice.project_id}`}>
                    {t("View project and milestones", "ดูโปรเจกต์และเป้าหมาย")}
                  </Link>
                </p> : null}
              {invoice.notes ? (
                <>
                  <Separator className="my-4" />
                  <Field label={t("Notes", "หมายเหตุ")} value={invoice.notes} />
                </>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("Line items", "รายการ")}</CardTitle>
            </CardHeader>
            <CardContent>
              <InvoiceItemsEditor
                invoiceId={invoice.id}
                items={itemRows}
                addAction={addInvoiceItem}
                deleteAction={removeInvoiceItem}
                locked={ctx.role === "member" || !!invoice.source_quote_id || !!invoice.issued_snapshot_id || paid > 0 || (claimsRes.data ?? []).some(claim => claim.status === "pending")}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("Payments", "การชำระเงิน")}</CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <EmptyState
                  icon={Wallet}
                  title={t("No payments yet", "ยังไม่มีการชำระเงิน")}
                  description={t(
                    "Only verified receipts appear here. Report a payment in the queue before verification.",
                    "แสดงเฉพาะยอดรับชำระที่ตรวจสอบแล้ว กรุณาแจ้งชำระในคิวก่อนการตรวจสอบ"
                  )}
                  className="border-0"
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("Date", "วันที่")}</TableHead>
                      <TableHead>{t("Method", "วิธีชำระ")}</TableHead>
                      <TableHead>{t("Notes", "หมายเหตุ")}</TableHead>
                      <TableHead className="text-right">{t("Amount", "จำนวนเงิน")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{p.paid_at}</TableCell>
                        <TableCell>{enumLabel(t, "payment_method", p.method)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {p.notes ?? "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatTHB(p.amount_satang)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("Payment claims", "ตรวจสอบการชำระ")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {t(
                  "Customer reports await verification. Only verified receipts reduce the open balance.",
                  "รายการแจ้งชำระจากลูกค้ารอการตรวจสอบ เฉพาะยอดที่ตรวจสอบแล้วจึงจะหักยอดค้างชำระ"
                )}
              </p>
              {claimsRes.error ? <p role="alert">{t("Payment queue unavailable. Reload before approving.", "คิวการชำระใช้งานไม่ได้ กรุณาโหลดใหม่ก่อนอนุมัติ")}</p> : (claimsRes.data ?? []).map(claim => <div key={claim.id} className="space-y-2 border-b py-4">
                <p>{formatTHB(claim.amount_satang)} · {claim.reference} · {claimStatusLabel(t, claim.status)}</p>
                {claim.status === "pending" && ctx.role !== "member" ? <ReviewClaimForm today={today} orgId={ctx.orgId} claimId={claim.id} invoiceId={invoice.id} suggestedBaht={satangToBahtString(claim.amount_satang)} /> : null}
              </div>)}
              {ctx.role !== "member" && outstanding > 0 && !["draft", "cancelled"].includes(invoice.status) && !(claimsRes.data ?? []).some(claim => claim.status === "pending") && !claimsRes.error ? <div className="border-t pt-4"><h3 className="mb-3 text-sm font-medium">{t("Staff report", "แจ้งชำระโดยเจ้าหน้าที่")}</h3><PaymentForm today={today} orgId={ctx.orgId} invoiceId={invoice.id} suggestedBaht={satangToBahtString(outstanding)} /></div> : null}
              {legacyRes.data?.length ? <div className="mt-6 space-y-4"><h3 className="text-sm font-medium">{t("Legacy reconciliation", "ตรวจสอบยอดเดิม")}</h3><p className="text-xs text-muted-foreground">{t("Retained records are excluded from verified cash. Match each to bank evidence before creating a linked verified receipt.", "รายการเดิมไม่นับรวมในเงินสดที่ตรวจสอบแล้ว กรุณาจับคู่กับหลักฐานธนาคารก่อนสร้างใบรับชำระที่ตรวจสอบแล้ว")}</p>{legacyRes.data.map(legacy => <div key={legacy.id} className="rounded border p-3 space-y-2"><p className="text-sm">{formatTHB(legacy.amount_satang)} · {legacy.paid_at.slice(0,10)} · {verificationLabel(t, legacy.verification_state)}</p><p className="text-xs text-muted-foreground">{legacy.notes ?? t("No original reference", "ไม่มีเลขอ้างอิงเดิม")}</p>{legacy.reconciled_payment_id ? <p className="text-xs">{t("Linked verified receipt: ", "ใบรับชำระที่ผูกไว้: ")}{legacy.reconciled_payment_id}</p> : null}{legacy.verification_state === "legacy_unverified" && ctx.role !== "member" && outstanding > 0 && !["draft", "cancelled"].includes(invoice.status) ? <PaymentForm today={today} orgId={ctx.orgId} invoiceId={invoice.id} legacyPaymentId={legacy.id} suggestedBaht={satangToBahtString(Math.min(legacy.amount_satang, outstanding))} /> : null}</div>)}</div> : null}
            </CardContent>
          </Card>
        </div>
      </div>

      {ctx.role !== "member" && invoice.status === "draft" && !invoice.source_quote_id && !invoice.issued_snapshot_id && paid === 0 && !(claimsRes.data ?? []).some(claim => claim.status === "pending") ? <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-base">{t("Edit invoice", "แก้ไขใบแจ้งหนี้")}</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceForm
            clients={clients}
            projects={projects}
            defaultValues={defaultValues}
            submitLabel={t("Save changes", "บันทึกการเปลี่ยนแปลง")}
            action={saveInvoice}
          />
        </CardContent>
      </Card> : null}
    </div>
  )
}
