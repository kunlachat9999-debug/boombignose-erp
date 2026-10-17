import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ClientForm } from "../_components/client-form"
import { createClient } from "../actions"
import { getT } from "@/lib/i18n-server"

export default async function NewClientPage() {
  const t = await getT()
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <PageHeader
        title={t("New client", "เพิ่มลูกค้า")}
        description={t("Add someone you work with.", "เพิ่มคนที่คุณทำงานด้วย")}
      >
        <Button variant="ghost" size="sm" render={<Link href="/clients" />}>
          <ArrowLeft />
          {t("Back", "กลับ")}
        </Button>
      </PageHeader>

      <Card>
        <CardContent>
          <ClientForm
            action={createClient}
            submitLabel={t("Create client", "สร้างลูกค้า")}
            redirectsOnSuccess
          />
        </CardContent>
      </Card>
    </div>
  )
}
