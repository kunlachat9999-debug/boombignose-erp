"use client"

import * as React from "react"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"

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
import { deleteTemplate } from "../actions"
import { useT } from "@/components/locale-provider"
import { translateMessage } from "@/lib/i18n-messages"

export function DeleteTemplateButton({
  id,
  name,
}: {
  id: string
  name: string
}) {
  const t = useT()
  const [pending, setPending] = React.useState(false)

  async function onConfirm() {
    setPending(true)
    const res = await deleteTemplate(id)
    // On success the action redirects to /templates; only an error returns.
    setPending(false)
    if (res?.error) toast.error(translateMessage(t, res.error))
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="destructive" />}>
        <Trash2 /> {t("Delete", "ลบ")}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("Delete template?", "ลบเทมเพลต?")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t(
              `This permanently deletes “${name}”. This cannot be undone.`,
              `“${name}” จะถูกลบถาวร ไม่สามารถย้อนกลับได้`
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("Cancel", "ยกเลิก")}</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={(e) => {
              e.preventDefault()
              void onConfirm()
            }}
          >
            {t("Delete", "ลบ")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
