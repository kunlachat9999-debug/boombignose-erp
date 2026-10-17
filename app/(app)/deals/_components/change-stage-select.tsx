"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import type { Enums } from "@/lib/types/database"
import { updateDealStage } from "../actions"
import { useT } from "@/components/locale-provider"
import { enumLabel } from "@/lib/enum-labels"
import { translateMessage } from "@/lib/i18n-messages"
import { Constants } from "@/lib/types/database"

export function ChangeStageSelect({
  dealId,
  stage,
}: {
  dealId: string
  stage: Enums<"deal_stage">
}) {
  const router = useRouter()
  const t = useT()
  const stages = Constants.public.Enums.deal_stage.map((s) => ({
    value: s,
    label: enumLabel(t, "deal_stage", s),
  }))
  const [value, setValue] = useState<Enums<"deal_stage">>(stage)
  const [isPending, startTransition] = useTransition()

  return (
    <Select
      items={stages}
      value={value}
      onValueChange={(next) => {
        const nextStage = next as Enums<"deal_stage">
        const prev = value
        setValue(nextStage)
        startTransition(async () => {
          const res = await updateDealStage(dealId, nextStage)
          if (res?.error) {
            setValue(prev)
            toast.error(translateMessage(t, res.error))
            return
          }
          toast.success(t("Stage updated", "อัปเดตขั้นตอนแล้ว"))
          router.refresh()
        })
      }}
      disabled={isPending}
    >
      <SelectTrigger className="w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {stages.map((s) => (
          <SelectItem key={s.value} value={s.value}>
            {s.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
