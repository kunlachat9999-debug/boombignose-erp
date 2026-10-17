"use client"

import { useState, useSyncExternalStore, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Play, Pause, Ban, ReceiptText, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import type { Enums } from "@/lib/types/database"
import { beginInvoiceRequest, readInvoiceRequest, acknowledgeInvoiceRequest } from "@/lib/billing/occurrence-command"

import {
  setSubscriptionStatus,
  generateInvoiceNow,
  deleteSubscription,
} from "../subscription-actions"
import { useT } from "@/components/locale-provider"
import { translateMessage } from "@/lib/i18n-messages"
import { enumLabel } from "@/lib/enum-labels"

type Status = Enums<"subscription_status">

function subscribeToRequests(onChange: () => void) {
  window.addEventListener("storage", onChange)
  window.addEventListener("erp.subscription.request", onChange)
  return () => {
    window.removeEventListener("storage", onChange)
    window.removeEventListener("erp.subscription.request", onChange)
  }
}

export function SubscriptionControls({
  id,
  orgId,
  status,
  canManage,
  occurrence,
  isDue,
}: {
  id: string
  orgId: string
  status: Status
  canManage: boolean
  occurrence: string
  isDue: boolean
}) {
  const router = useRouter()
  const t = useT()
  const [pending, startTransition] = useTransition()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const unacknowledged = useSyncExternalStore(subscribeToRequests, () => {
    try { return readInvoiceRequest(sessionStorage, orgId, id)?.occurrence ?? null } catch { return null }
  }, () => null)

  function changeStatus(next: Status) {
    startTransition(async () => {
      const res = await setSubscriptionStatus({ id, status: next })
      if (res?.error) {
        toast.error(translateMessage(t, res.error))
        return
      }
      toast.success(
        t(`Subscription ${next}`, `อัปเดตสถานะเป็น${enumLabel(t, "subscription_status", next)}แล้ว`)
      )
      router.refresh()
    })
  }

  function generate() {
    startTransition(async () => {
      try {
        const command = beginInvoiceRequest(sessionStorage, orgId, id, occurrence)
        window.dispatchEvent(new Event("erp.subscription.request"))
        const res = await generateInvoiceNow({ id, occurrence: command.occurrence })
        if (res?.error) { toast.error(translateMessage(t, res.error)); return }
        acknowledgeInvoiceRequest(sessionStorage, orgId, id, command.occurrence)
        window.dispatchEvent(new Event("erp.subscription.request"))
        toast.success(t("Scheduled invoice draft ready", "สร้างร่างใบแจ้งหนี้ตามรอบแล้ว"))
        router.refresh()
      } catch {
        toast.error(t("Could not confirm the invoice request. Retry in this tab.", "ยืนยันคำขอใบแจ้งหนี้ไม่ได้ กรุณาลองใหม่ในแท็บนี้"))
      }
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {canManage && status !== "active" ? (
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => changeStatus("active")}
        >
          <Play /> {t("Activate", "เปิดใช้งาน")}
        </Button>
      ) : canManage ? (
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => changeStatus("paused")}
        >
          <Pause /> {t("Pause", "พักไว้")}
        </Button>
      ) : null}

      {canManage && status !== "cancelled" ? (
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => changeStatus("cancelled")}
        >
          <Ban /> {t("Cancel", "ยกเลิก")}
        </Button>
      ) : null}

      {canManage ? (
        <>
          <Button size="sm" disabled={pending || (!isDue && !unacknowledged) || status !== "active"} onClick={generate}>
            <ReceiptText /> {unacknowledged
              ? t(`Retry invoice for ${unacknowledged}`, `ลองสร้างใบแจ้งหนี้รอบ ${unacknowledged} อีกครั้ง`)
              : t("Generate scheduled invoice", "สร้างใบแจ้งหนี้ตามรอบ")}
          </Button>

          <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <AlertDialogTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  aria-label={t("Delete subscription", "ลบรายการสมัครสมาชิก")}
                >
                  <Trash2 className="text-muted-foreground" /> {t("Delete", "ลบ")}
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("Delete this subscription?", "ลบรายการสมัครสมาชิกนี้?")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t(
                    "This subscription will be permanently removed. Invoices already generated from it are kept. This cannot be undone.",
                    "รายการนี้จะถูกลบถาวร ใบแจ้งหนี้ที่สร้างไปแล้วจะยังอยู่ ไม่สามารถย้อนกลับได้"
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("Cancel", "ยกเลิก")}</AlertDialogCancel>
                <AlertDialogAction
                  disabled={pending}
                  onClick={(e) => {
                    e.preventDefault()
                    startTransition(async () => {
                      const res = await deleteSubscription({ id })
                      if (res?.error) {
                        toast.error(translateMessage(t, res.error))
                        return
                      }
                      toast.success(t("Subscription deleted", "ลบรายการสมัครสมาชิกแล้ว"))
                    })
                  }}
                >
                  {t("Delete", "ลบ")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      ) : null}
    </div>
  )
}
