import { ScrollText } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { requireOrgContext, requireCapability } from "@/lib/auth"
import { auditSentence, relativeTime } from "@/lib/audit/format"
import { PageHeader } from "@/components/page-header"
import { EmptyState } from "@/components/empty-state"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { T } from "@/lib/i18n"
import { getT } from "@/lib/i18n-server"

export const dynamic = "force-dynamic"

const ENTITY_TH: Record<string, string> = {
  client: "ลูกค้า",
  contact: "ผู้ติดต่อ",
  deal: "ดีล",
  quote: "ใบเสนอราคา",
  invoice: "ใบแจ้งหนี้",
  payment: "การชำระเงิน",
  project: "โปรเจกต์",
  subscription: "รายการสมัครสมาชิก",
  invitation: "คำเชิญ",
  settings: "ตั้งค่า",
}

/** Short label per entity for the row badge. */
function entityLabel(t: T, entity: string): string {
  return t(entity.charAt(0).toUpperCase() + entity.slice(1), ENTITY_TH[entity] ?? entity)
}

export default async function AuditPage() {
  const ctx = await requireOrgContext()
  const t = await getT()
  // Activity history is settings-class data: owners/admins only.
  requireCapability(ctx, "audit:view")

  const supabase = await createClient()
  const { data: rows } = await supabase
    .from("audit_log")
    .select("id, actor_email, entity, entity_id, action, summary, created_at")
    .eq("org_id", ctx.orgId)
    .order("created_at", { ascending: false })
    .limit(100)

  const entries = rows ?? []
  const now = new Date()

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Activity", "ประวัติกิจกรรม")}
        description={t("A running history of changes across your workspace.", "ประวัติการเปลี่ยนแปลงทั้งหมดในพื้นที่ทำงาน")}
      />

      {entries.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title={t("No activity yet", "ยังไม่มีกิจกรรม")}
          description={t(
            "Changes to deals, invoices, payments, and settings will appear here.",
            "การเปลี่ยนแปลงของดีล ใบแจ้งหนี้ การชำระเงิน และการตั้งค่าจะแสดงที่นี่"
          )}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y">
              {entries.map((row) => (
                <li
                  key={row.id}
                  className="flex items-start justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-sm leading-snug">
                      {auditSentence({
                        actorEmail: row.actor_email,
                        action: row.action,
                        entity: row.entity,
                        summary: row.summary,
                      })}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {relativeTime(row.created_at, now, t)}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0 capitalize">
                    {entityLabel(t, row.entity)}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
