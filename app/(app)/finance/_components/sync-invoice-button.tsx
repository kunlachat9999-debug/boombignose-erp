"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

import { syncInvoiceToAccounting } from "../accounting-actions"
import { useT } from "@/components/locale-provider"
import { translateMessage } from "@/lib/i18n-messages"

/**
 * "Sync to accounting" — pushes the invoice to the connected provider (a stub
 * in this MVP) and records the mapping. Re-clicking re-syncs idempotently.
 */
export function SyncInvoiceButton({ invoiceId }: { invoiceId: string }) {
  const router = useRouter()
  const t = useT()
  const [pending, startTransition] = useTransition()

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await syncInvoiceToAccounting(invoiceId)
          if (res?.error) {
            toast.error(translateMessage(t, res.error))
            return
          }
          toast.success(
            res.externalId
              ? t(`Synced to accounting (${res.externalId})`, `ซิงก์ไประบบบัญชีแล้ว (${res.externalId})`)
              : t("Synced to accounting", "ซิงก์ไประบบบัญชีแล้ว")
          )
          router.refresh()
        })
      }
    >
      <RefreshCw className={pending ? "animate-spin" : undefined} />
      {pending ? t("Syncing…", "กำลังซิงก์…") : t("Sync to accounting", "ซิงก์ไประบบบัญชี")}
    </Button>
  )
}
