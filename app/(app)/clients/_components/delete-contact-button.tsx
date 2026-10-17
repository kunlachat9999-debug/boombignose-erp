"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { deleteContact } from "../actions"
import { useT } from "@/components/locale-provider"
import { translateMessage } from "@/lib/i18n-messages"

export function DeleteContactButton({
  contactId,
  clientId,
}: {
  contactId: string
  clientId: string
}) {
  const router = useRouter()
  const t = useT()
  const [pending, startTransition] = useTransition()

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={t("Remove contact", "ลบผู้ติดต่อ")}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await deleteContact(contactId, clientId)
          if (res?.error) {
            toast.error(translateMessage(t, res.error))
            return
          }
          toast.success(t("Contact removed", "ลบผู้ติดต่อแล้ว"))
          router.refresh()
        })
      }
    >
      <Trash2 className="text-muted-foreground" />
    </Button>
  )
}
