"use client"

import { useTransition } from "react"
import { toast } from "sonner"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Constants, type Enums } from "@/lib/types/database"
import { updateProjectStatus } from "../actions"
import { useT } from "@/components/locale-provider"
import { translateMessage } from "@/lib/i18n-messages"
import { enumLabel } from "@/lib/enum-labels"

type ProjectStatus = Enums<"project_status">

export function StatusSelect({
  projectId,
  status,
}: {
  projectId: string
  status: ProjectStatus
}) {
  const [pending, startTransition] = useTransition()
  const t = useT()

  return (
    <Select
      value={status}
      disabled={pending}
      onValueChange={(v) => {
        if (!v || v === status) return
        startTransition(async () => {
          const res = await updateProjectStatus({
            id: projectId,
            status: v as ProjectStatus,
          })
          if (res?.error) toast.error(translateMessage(t, res.error))
          else toast.success(t("Status updated", "อัปเดตสถานะแล้ว"))
        })
      }}
    >
      <SelectTrigger size="sm">
        <SelectValue>{(v: ProjectStatus) => enumLabel(t, "project_status", v)}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Constants.public.Enums.project_status.map((s) => (
          <SelectItem key={s} value={s}>
            {enumLabel(t, "project_status", s)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
