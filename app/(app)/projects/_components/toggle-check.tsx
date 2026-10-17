"use client"

import { useTransition } from "react"
import { toast } from "sonner"

import { Checkbox } from "@/components/ui/checkbox"
import { toggleTask, toggleMilestone } from "../actions"
import { useT } from "@/components/locale-provider"
import { translateMessage } from "@/lib/i18n-messages"

export function TaskToggle({
  id,
  projectId,
  done,
  label,
}: {
  id: string
  projectId: string
  done: boolean
  label: string
}) {
  const [pending, startTransition] = useTransition()
  const t = useT()
  return (
    <Checkbox
      checked={done}
      disabled={pending}
      aria-label={label}
      onCheckedChange={(value) =>
        startTransition(async () => {
          const res = await toggleTask({ id, projectId, done: value === true })
          if (res?.error) toast.error(translateMessage(t, res.error))
        })
      }
    />
  )
}

export function MilestoneToggle({
  id,
  projectId,
  done,
  label,
}: {
  id: string
  projectId: string
  done: boolean
  label: string
}) {
  const [pending, startTransition] = useTransition()
  const t = useT()
  return (
    <Checkbox
      checked={done}
      disabled={pending}
      aria-label={label}
      onCheckedChange={(value) =>
        startTransition(async () => {
          const res = await toggleMilestone({
            id,
            projectId,
            done: value === true,
          })
          if (res?.error) toast.error(translateMessage(t, res.error))
        })
      }
    />
  )
}
