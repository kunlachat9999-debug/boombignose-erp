"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EmptyState } from "@/components/empty-state"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { Enums } from "@/lib/types/database"
import { addActivity, toggleActivityDone } from "../actions"
import { useT } from "@/components/locale-provider"
import { enumLabel } from "@/lib/enum-labels"
import { translateMessage } from "@/lib/i18n-messages"

type Activity = {
  id: string
  type: Enums<"activity_type">
  body: string | null
  due_date: string | null
  done: boolean
}

const TYPES: Enums<"activity_type">[] = ["follow_up", "call", "email", "meeting", "note"]

export function ActivitiesSection({
  dealId,
  activities,
  today,
}: {
  dealId: string
  activities: Activity[]
  today: string
}) {
  const router = useRouter()
  const t = useT()
  const typeOptions = TYPES.map((value) => ({
    value,
    label: enumLabel(t, "activity_type", value),
  }))
  const [type, setType] = useState<Enums<"activity_type">>("follow_up")
  const [body, setBody] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [isPending, startTransition] = useTransition()

  function submit() {
    startTransition(async () => {
      const res = await addActivity({ dealId, type, body, dueDate })
      if (res?.error) {
        toast.error(translateMessage(t, res.error))
        return
      }
      setBody("")
      setDueDate("")
      setType("follow_up")
      toast.success(t("Activity added", "เพิ่มกิจกรรมแล้ว"))
      router.refresh()
    })
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3 rounded-lg border p-4">
        <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
          <div className="space-y-1.5">
            <Label htmlFor="activity-type">{t("Type", "ประเภท")}</Label>
            <Select
              items={typeOptions}
              value={type}
              onValueChange={(v) => setType(v as Enums<"activity_type">)}
            >
              <SelectTrigger id="activity-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="activity-due">{t("Due date", "วันครบกำหนด")}</Label>
            <Input
              id="activity-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="activity-body">{t("Notes", "บันทึก")}</Label>
          <Textarea
            id="activity-body"
            rows={2}
            placeholder={t("What needs to happen?", "ต้องทำอะไรบ้าง?")}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>
        <Button type="button" onClick={submit} disabled={isPending}>
          {t("Add activity", "เพิ่มกิจกรรม")}
        </Button>
      </div>

      {activities.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title={t("No activities yet", "ยังไม่มีกิจกรรม")}
          description={t("Log a call, email, or follow-up to keep this deal moving.", "บันทึกการโทร อีเมล หรือการติดตามผล เพื่อให้ดีลเดินหน้า")}
          className="border-0 p-6"
        />
      ) : (
        <ul className="divide-y rounded-lg border">
          {activities.map((a) => {
            const overdue = !a.done && a.due_date != null && a.due_date < today
            const dueToday = !a.done && a.due_date === today
            return (
              <li key={a.id} className="flex items-start gap-3 p-3">
                <ToggleDone id={a.id} done={a.done} dealId={dealId} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                      {enumLabel(t, "activity_type", a.type)}
                    </span>
                    {a.due_date ? (
                      <span
                        className={cn(
                          "text-xs",
                          overdue
                            ? "font-medium text-red-600 dark:text-red-400"
                            : dueToday
                              ? "font-medium text-amber-600 dark:text-amber-400"
                              : "text-muted-foreground"
                        )}
                      >
                        {overdue
                          ? t("Overdue · ", "เลยกำหนด · ")
                          : dueToday
                            ? t("Due today · ", "ครบกำหนดวันนี้ · ")
                            : t("Due ", "ครบกำหนด ")}
                        {a.due_date}
                      </span>
                    ) : null}
                  </div>
                  <p
                    className={cn(
                      "text-sm",
                      a.done && "text-muted-foreground line-through"
                    )}
                  >
                    {a.body ?? "—"}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function ToggleDone({
  id,
  done,
  dealId,
}: {
  id: string
  done: boolean
  dealId: string
}) {
  const router = useRouter()
  const t = useT()
  const [isPending, startTransition] = useTransition()

  return (
    <Checkbox
      checked={done}
      disabled={isPending}
      className="mt-0.5"
      aria-label={done ? t("Mark not done", "ทำเครื่องหมายว่ายังไม่เสร็จ") : t("Mark done", "ทำเครื่องหมายว่าเสร็จ")}
      onCheckedChange={(checked) => {
        startTransition(async () => {
          const res = await toggleActivityDone(id, checked === true, dealId)
          if (res?.error) {
            toast.error(translateMessage(t, res.error))
            return
          }
          router.refresh()
        })
      }}
    />
  )
}
