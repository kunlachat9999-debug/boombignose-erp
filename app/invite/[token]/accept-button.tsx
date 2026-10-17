"use client"

import { useTransition } from "react"
import { Check } from "lucide-react"
import { toast } from "sonner"

import { acceptInvitation } from "@/app/(app)/settings/org-actions"
import { Button } from "@/components/ui/button"
import { useT } from "@/components/locale-provider"
import { translateMessage } from "@/lib/i18n-messages"

/** Accepts the invitation; on success the action redirects to the dashboard. */
export function AcceptInvitationButton({ token }: { token: string }) {
  const [pending, startTransition] = useTransition()
  const t = useT()

  return (
    <Button
      className="w-full"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await acceptInvitation({ token })
          if (res?.error) toast.error(translateMessage(t, res.error))
        })
      }
    >
      <Check /> {t("Accept invitation", "รับคำเชิญ")}
    </Button>
  )
}
