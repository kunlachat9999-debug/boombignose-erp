"use client"

import { cn } from "@/lib/utils"
import { useT } from "@/components/locale-provider"

/** Dot + label pairs describing the colour coding used across day cells. */
const LEGEND: { label: string; th: string; className: string }[] = [
  { label: "Follow-up", th: "ติดตามผล", className: "bg-amber-500" },
  { label: "Meeting", th: "ประชุม", className: "bg-violet-500" },
  { label: "Call", th: "โทร", className: "bg-blue-500" },
  { label: "Email / Note", th: "อีเมล / บันทึก", className: "bg-muted-foreground" },
  { label: "Invoice due", th: "ใบแจ้งหนี้ครบกำหนด", className: "bg-red-500" },
  { label: "Project deadline", th: "กำหนดส่งโปรเจกต์", className: "bg-emerald-500" },
]

export function CalendarLegend() {
  const t = useT()
  return (
    <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
      {LEGEND.map((l) => (
        <span key={l.label} className="inline-flex items-center gap-1.5">
          <span className={cn("size-2 rounded-full", l.className)} />
          {t(l.label, l.th)}
        </span>
      ))}
    </div>
  )
}
