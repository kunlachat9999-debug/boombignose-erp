import type { T } from "@/lib/i18n"

/**
 * Deadline display helpers for the Projects module.
 * Dates are stored as YYYY-MM-DD (date columns) with no time component.
 */

const fmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
})

/** Whole-day difference (target - today). Negative = past. */
function daysUntil(date: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(`${date}T00:00:00`)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

export type DeadlineMeta = {
  label: string
  note: string | null
  tone: "default" | "warning" | "danger"
}

/**
 * Format a deadline with a relative note and tone:
 *  - overdue (past)  → danger
 *  - due within 7 days → warning
 *  - otherwise → default (no note)
 */
export function deadlineMeta(t: T, date: string | null): DeadlineMeta | null {
  if (!date) return null
  const label = fmt.format(new Date(`${date}T00:00:00`))
  const diff = daysUntil(date)

  if (diff < 0) {
    const d = Math.abs(diff)
    return {
      label,
      note: t(d === 1 ? "1 day overdue" : `${d} days overdue`, `เลยกำหนด ${d} วัน`),
      tone: "danger",
    }
  }
  if (diff === 0) return { label, note: t("Due today", "ครบกำหนดวันนี้"), tone: "warning" }
  if (diff <= 7) {
    return {
      label,
      note:
        diff === 1
          ? t("Due tomorrow", "ครบกำหนดพรุ่งนี้")
          : t(`In ${diff} days`, `อีก ${diff} วัน`),
      tone: "warning",
    }
  }
  return { label, note: null, tone: "default" }
}

/** Plain date format with no relative note (for tasks/milestones). */
export function formatDate(date: string | null): string {
  if (!date) return "—"
  return fmt.format(new Date(`${date}T00:00:00`))
}
