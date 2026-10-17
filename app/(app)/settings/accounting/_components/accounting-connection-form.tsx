"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plug, Unplug } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  connectAccounting,
  disconnectAccounting,
  type ConnectAccountingInput,
} from "../actions"
import { useT } from "@/components/locale-provider"
import { translateMessage } from "@/lib/i18n-messages"

type ProviderKey = ConnectAccountingInput["provider"]

const PROVIDER_OPTIONS: { value: ProviderKey; label: string }[] = [
  { value: "flowaccount", label: "FlowAccount" },
  { value: "peak", label: "PEAK" },
  { value: "xero", label: "Xero" },
]

/**
 * Owner/admin controls for the org's accounting connection. When connected,
 * shows a Disconnect button; otherwise a provider picker + Connect. There is no
 * OAuth handshake in this MVP — connecting just records intent so invoices can
 * be scaffold-synced.
 */
export function AccountingConnectionForm({
  connectedProvider,
}: {
  connectedProvider: ProviderKey | null
}) {
  const router = useRouter()
  const t = useT()
  const [pending, startTransition] = useTransition()
  const [provider, setProvider] = useState<ProviderKey>(
    connectedProvider ?? "flowaccount"
  )

  const isConnected = connectedProvider !== null

  if (isConnected) {
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm">
          {t(
            "Disconnecting stops new invoice syncs. Existing sync records are kept.",
            "การยกเลิกเชื่อมต่อจะหยุดการซิงก์ใบแจ้งหนี้ใหม่ ประวัติการซิงก์เดิมยังเก็บไว้"
          )}
        </p>
        <Button
          variant="outline"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await disconnectAccounting()
              if (res?.error) {
                toast.error(translateMessage(t, res.error))
                return
              }
              toast.success(t("Accounting provider disconnected", "ยกเลิกการเชื่อมต่อระบบบัญชีแล้ว"))
              router.refresh()
            })
          }
        >
          <Unplug /> {pending ? t("Disconnecting…", "กำลังยกเลิก…") : t("Disconnect", "ยกเลิกการเชื่อมต่อ")}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="provider">
          {t("Provider", "ผู้ให้บริการ")}
        </label>
        <Select
          items={PROVIDER_OPTIONS}
          value={provider}
          onValueChange={(v: string | null) =>
            setProvider((v as ProviderKey) ?? "flowaccount")
          }
        >
          <SelectTrigger id="provider" className="w-full sm:w-56">
            <SelectValue placeholder={t("Select a provider", "เลือกผู้ให้บริการ")} />
          </SelectTrigger>
          <SelectContent>
            {PROVIDER_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await connectAccounting({ provider })
            if (res?.error) {
              toast.error(translateMessage(t, res.error))
              return
            }
            toast.success(t("Accounting provider connected", "เชื่อมต่อระบบบัญชีแล้ว"))
            router.refresh()
          })
        }
      >
        <Plug /> {pending ? t("Connecting…", "กำลังเชื่อมต่อ…") : t("Connect", "เชื่อมต่อ")}
      </Button>
    </div>
  )
}
