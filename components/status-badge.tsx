"use client"

import { useT } from "@/components/locale-provider"
import { Badge } from "@/components/ui/badge"
import { enumLabel } from "@/lib/enum-labels"
import { cn } from "@/lib/utils"
import type { Enums } from "@/lib/types/database"

type Tone = "neutral" | "info" | "progress" | "success" | "warning" | "danger"

const TONE: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground border-transparent",
  info: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-transparent",
  progress:
    "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300 border-transparent",
  success:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-transparent",
  warning:
    "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border-transparent",
  danger: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-transparent",
}

function Pill({ label, tone }: { label: string; tone: Tone }) {
  return (
    <Badge variant="outline" className={cn("font-medium", TONE[tone])}>
      {label}
    </Badge>
  )
}

const DEAL_STAGE: Record<Enums<"deal_stage">, Tone> = {
  lead: "neutral",
  contacted: "info",
  discovery: "info",
  proposal: "progress",
  negotiation: "warning",
  won: "success",
  lost: "danger",
}

const PROJECT_STATUS: Record<Enums<"project_status">, Tone> = {
  not_started: "neutral",
  in_progress: "progress",
  review: "info",
  delivered: "success",
  support: "info",
  paused: "warning",
  cancelled: "danger",
}

const INVOICE_STATUS: Record<Enums<"invoice_status">, Tone> = {
  draft: "neutral",
  sent: "info",
  partially_paid: "warning",
  paid: "success",
  overdue: "danger",
  cancelled: "neutral",
}

const TASK_STATUS: Record<Enums<"task_status">, Tone> = {
  todo: "neutral",
  in_progress: "progress",
  done: "success",
}

export function DealStageBadge({ stage }: { stage: Enums<"deal_stage"> }) {
  const t = useT()
  return <Pill label={enumLabel(t, "deal_stage", stage)} tone={DEAL_STAGE[stage]} />
}

export function ProjectStatusBadge({ status }: { status: Enums<"project_status"> }) {
  const t = useT()
  return <Pill label={enumLabel(t, "project_status", status)} tone={PROJECT_STATUS[status]} />
}

export function InvoiceStatusBadge({ status }: { status: Enums<"invoice_status"> }) {
  const t = useT()
  return <Pill label={enumLabel(t, "invoice_status", status)} tone={INVOICE_STATUS[status]} />
}

export function TaskStatusBadge({ status }: { status: Enums<"task_status"> }) {
  const t = useT()
  return <Pill label={enumLabel(t, "task_status", status)} tone={TASK_STATUS[status]} />
}
