import Link from "next/link"
import { Users, Plus } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { requireOrgContext } from "@/lib/auth"
import { PageHeader } from "@/components/page-header"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate } from "./_lib/format"
import { ClientsToolbar } from "./_components/clients-toolbar"
import { getT } from "@/lib/i18n-server"

export const dynamic = "force-dynamic"

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const ctx = await requireOrgContext()
  const t = await getT()
  const supabase = await createClient()
  const { q: qParam } = await searchParams
  const q = (qParam ?? "").trim()

  let query = supabase
    .from("clients")
    .select("id, name, industry, source, created_at")
    .eq("org_id", ctx.orgId)
    .order("name", { ascending: true })
  if (q) query = query.ilike("name", `%${q}%`)

  const { data: clients } = await query
  const hasClients = (clients?.length ?? 0) > 0

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Clients", "ลูกค้า")}
        description={t("Everyone you work with, and who to talk to.", "ทุกคนที่คุณทำงานด้วย และผู้ติดต่อของแต่ละราย")}
      >
        <Button render={<Link href="/clients/new" />}>
          <Plus />
          {t("New client", "เพิ่มลูกค้า")}
        </Button>
      </PageHeader>

      {hasClients || q ? <ClientsToolbar q={q} /> : null}

      {!clients || clients.length === 0 ? (
        q ? (
          <EmptyState
            icon={Users}
            title={t("No matching clients", "ไม่พบลูกค้าที่ค้นหา")}
            description={t("No clients match your search. Try a different name.", "ไม่มีลูกค้าที่ตรงกับคำค้นหา ลองใช้ชื่ออื่น")}
          />
        ) : (
          <EmptyState
            icon={Users}
            title={t("No clients yet", "ยังไม่มีลูกค้า")}
            description={t("Add your first client to start tracking contacts, deals, and work.", "เพิ่มลูกค้ารายแรกเพื่อเริ่มติดตามผู้ติดต่อ ดีล และงาน")}
            action={
              <Button render={<Link href="/clients/new" />}>
                <Plus />
                {t("New client", "เพิ่มลูกค้า")}
              </Button>
            }
          />
        )
      ) : (
        <div className="rounded-xl ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("Name", "ชื่อ")}</TableHead>
                <TableHead>{t("Industry", "อุตสาหกรรม")}</TableHead>
                <TableHead>{t("Source", "แหล่งที่มา")}</TableHead>
                <TableHead className="text-right">{t("Added", "วันที่เพิ่ม")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/clients/${c.id}`}
                      className="hover:underline"
                    >
                      {c.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.industry ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.source ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-right">
                    {formatDate(c.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
