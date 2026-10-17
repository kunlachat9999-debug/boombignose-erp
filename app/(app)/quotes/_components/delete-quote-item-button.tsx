"use client"

import { useState, useTransition } from "react"
import { Trash2 } from "lucide-react"
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

import { deleteQuoteItem } from "../actions"
import { useT } from "@/components/locale-provider"
import { translateMessage } from "@/lib/i18n-messages"

export function DeleteQuoteItemButton({
  id,
  label,
}: {
  id: string
  label: string
}) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label={t(`Delete ${label}`, `ลบ ${label}`)}>
            <Trash2 className="text-muted-foreground" />
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("Remove this line item?", "ลบรายการนี้?")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t(
              `${label} will be removed and the quote total recalculated.`,
              `${label} จะถูกลบและคำนวณยอดรวมใบเสนอราคาใหม่`
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
                const res = await deleteQuoteItem({ id })
                if (res?.error) {
                  toast.error(translateMessage(t, res.error))
                  return
                }
                toast.success(t("Item removed", "ลบรายการแล้ว"))
                setOpen(false)
              })
            }}
          >
            {t("Remove", "ลบ")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
