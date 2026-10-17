"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Enums } from "@/lib/types/database"
import { useT } from "@/components/locale-provider"
import { enumLabel } from "@/lib/enum-labels"

// Local badge for subscription_status. The shared components/status-badge.tsx is
// owned by another module, so we mirror its tone styling here self-contained.
const STATUS: Record<
  Enums<"subscription_status">,
  string
> = {
  active:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-transparent",
  paused:
    "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border-transparent",
  cancelled: "bg-muted text-muted-foreground border-transparent",
}

export function SubscriptionStatusBadge({
  status,
}: {
  status: Enums<"subscription_status">
}) {
  const t = useT()
  return (
    <Badge variant="outline" className={cn("font-medium", STATUS[status])}>
      {enumLabel(t, "subscription_status", status)}
    </Badge>
  )
}
