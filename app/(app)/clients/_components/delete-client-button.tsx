"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"

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
import { Button } from "@/components/ui/button"
import { deleteClient } from "../actions"
import { useT } from "@/components/locale-provider"
import { translateMessage } from "@/lib/i18n-messages"

export function DeleteClientButton({
  id,
  name,
}: {
  id: string
  name: string
}) {
  const [pending, startTransition] = useTransition()
  const t = useT()

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>
        <Trash2 />
        {t("Delete", "ลบ")}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t(`Delete ${name}?`, `ลบ ${name}?`)}</AlertDialogTitle>
          <AlertDialogDescription>
            {t(
              "This permanently removes the client and its contacts. Deals and activities linked to it are kept. This cannot be undone.",
              "ลูกค้าและผู้ติดต่อทั้งหมดจะถูกลบถาวร ส่วนดีลและกิจกรรมที่เกี่ยวข้องจะยังอยู่ ไม่สามารถย้อนกลับได้"
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{t("Cancel", "ยกเลิก")}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await deleteClient(id)
                // On success the action redirects; only an error returns here.
                if (res?.error) toast.error(translateMessage(t, res.error))
              })
            }
          >
            {t("Delete client", "ลบลูกค้า")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
