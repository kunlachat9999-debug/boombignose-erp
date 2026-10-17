"use client"

import { useTransition } from "react"
import { Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { deleteDeal } from "../actions"
import { useT } from "@/components/locale-provider"
import { translateMessage } from "@/lib/i18n-messages"

export function DeleteDealButton({ dealId }: { dealId: string }) {
  const [isPending, startTransition] = useTransition()
  const t = useT()

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button variant="outline" disabled={isPending}>
            <Trash2 className="size-4" />
            {t("Delete", "ลบ")}
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("Delete this deal?", "ลบดีลนี้?")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t(
              "This permanently removes the deal. Linked activities are kept but detached. This can't be undone.",
              "ดีลนี้จะถูกลบถาวร กิจกรรมที่เกี่ยวข้องจะยังอยู่แต่ไม่ผูกกับดีลแล้ว ไม่สามารถย้อนกลับได้"
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("Cancel", "ยกเลิก")}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={(e) => {
              // Run the delete; the action redirects on success.
              e.preventDefault()
              startTransition(async () => {
                const res = await deleteDeal(dealId)
                if (res?.error) toast.error(translateMessage(t, res.error))
              })
            }}
          >
            {t("Delete deal", "ลบดีล")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
