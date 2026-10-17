import Link from "next/link"
import { ArrowLeft, Lock, PlugZap } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { requireOrgContext } from "@/lib/auth"
import type { Enums } from "@/lib/types/database"

import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { AccountingConnectionForm } from "./_components/accounting-connection-form"
import { getT } from "@/lib/i18n-server"

export const dynamic = "force-dynamic"

const PROVIDER_LABEL: Record<Enums<"accounting_provider">, string> = {
  flowaccount: "FlowAccount",
  peak: "PEAK",
  xero: "Xero",
}

const STATUS_META: Record<
  Enums<"accounting_conn_status">,
  { label: string; th: string; variant: "secondary" | "outline" | "destructive" }
> = {
  connected: { label: "Connected", th: "เชื่อมต่อแล้ว", variant: "secondary" },
  disconnected: { label: "Not connected", th: "ยังไม่เชื่อมต่อ", variant: "outline" },
  error: { label: "Error", th: "ผิดพลาด", variant: "destructive" },
}

export default async function AccountingSettingsPage() {
  const ctx = await requireOrgContext()
  const t = await getT()
  const supabase = await createClient()
  const canEdit = ctx.role === "owner" || ctx.role === "admin"

  // Single row per org (org_id unique). May not exist yet.
  const { data: conn } = await supabase
    .from("accounting_connections")
    .select("provider, status, updated_at")
    .eq("org_id", ctx.orgId)
    .maybeSingle()

  const status = conn?.status ?? "disconnected"
  const isConnected = status === "connected"
  const statusMeta = STATUS_META[status]

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Accounting sync", "ซิงก์ระบบบัญชี")}
        description={t("Connect your book-of-record to scaffold invoice syncing.", "เชื่อมต่อระบบบัญชีหลักเพื่อซิงก์ใบแจ้งหนี้")}
      >
        <Button variant="outline" render={<Link href="/settings" />}>
          <ArrowLeft /> {t("Settings", "ตั้งค่า")}
        </Button>
      </PageHeader>

      <Alert>
        <PlugZap className="size-4" />
        <AlertTitle>{t("Sync scaffold — not an accounting engine", "โครงการซิงก์ — ไม่ใช่ระบบบัญชี")}</AlertTitle>
        <AlertDescription>
          {t(
            "This maps invoices to your provider (FlowAccount, PEAK or Xero) and records the mapping. It does not create tax invoices or compute VAT, and the live push is stubbed in this build.",
            "ระบบจะจับคู่ใบแจ้งหนี้กับผู้ให้บริการ (FlowAccount, PEAK หรือ Xero) และบันทึกการจับคู่ไว้ ไม่ได้ออกใบกำกับภาษีหรือคำนวณ VAT และในเวอร์ชันนี้ยังไม่ได้ส่งข้อมูลจริง"
          )}
        </AlertDescription>
      </Alert>

      <Card className="max-w-2xl">
        <CardHeader className="flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">{t("Connection", "การเชื่อมต่อ")}</CardTitle>
            <CardDescription>
              {isConnected && conn
                ? t(`Syncing to ${PROVIDER_LABEL[conn.provider]}.`, `กำลังซิงก์กับ ${PROVIDER_LABEL[conn.provider]}`)
                : t("No accounting provider connected yet.", "ยังไม่ได้เชื่อมต่อระบบบัญชี")}
            </CardDescription>
          </div>
          <Badge variant={statusMeta.variant} className="shrink-0">
            {t(statusMeta.label, statusMeta.th)}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {conn ? (
            <dl className="divide-y text-sm">
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-muted-foreground">{t("Provider", "ผู้ให้บริการ")}</dt>
                <dd className="font-medium">
                  {PROVIDER_LABEL[conn.provider]}
                </dd>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-muted-foreground">{t("Status", "สถานะ")}</dt>
                <dd className="font-medium">{t(statusMeta.label, statusMeta.th)}</dd>
              </div>
            </dl>
          ) : null}

          {canEdit ? (
            <AccountingConnectionForm
              connectedProvider={isConnected && conn ? conn.provider : null}
            />
          ) : (
            <Alert>
              <Lock className="size-4" />
              <AlertTitle>{t("View only", "ดูอย่างเดียว")}</AlertTitle>
              <AlertDescription>
                {t("Only an owner or admin can change the accounting connection.", "เฉพาะเจ้าของหรือผู้ดูแลเท่านั้นที่เปลี่ยนการเชื่อมต่อระบบบัญชีได้")}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
