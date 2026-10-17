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

import { deleteCost } from "../actions"
import { useT } from "@/components/locale-provider"
import { translateMessage } from "@/lib/i18n-messages"

export function DeleteCostButton({
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
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t(`Delete ${label}`, `ลบ${label}`)}
          >
            <Trash2 className="text-muted-foreground" />
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("Delete this cost?", "ลบค่าใช้จ่ายนี้?")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t(
              `${label} will be permanently removed. This cannot be undone.`,
              `${label} จะถูกลบถาวร ไม่สามารถย้อนกลับได้`
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
                const res = await deleteCost({ id })
                if (res?.error) {
                  toast.error(translateMessage(t, res.error))
                  return
                }
                toast.success(t("Cost deleted", "ลบค่าใช้จ่ายแล้ว"))
                setOpen(false)
              })
            }}
          >
            {t("Delete", "ลบ")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
