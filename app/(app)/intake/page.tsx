"use client"

import { useState, useTransition } from "react"
import { NotebookPen, ListChecks, Copy, Check } from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/empty-state"
import { intakeMeeting, type IntakeResult } from "./actions"
import type { ActionItem } from "@/lib/ai/parse"
import { useT } from "@/components/locale-provider"
import { translateMessage } from "@/lib/i18n-messages"

type State =
  | { status: "idle" }
  | { status: "notConfigured" }
  | { status: "done"; content: string; items: ActionItem[] }

export default function IntakePage() {
  const t = useT()
  const [notes, setNotes] = useState("")
  const [state, setState] = useState<State>({ status: "idle" })
  const [pending, startTransition] = useTransition()
  const [copied, setCopied] = useState(false)

  function submit() {
    setCopied(false)
    startTransition(async () => {
      const res: IntakeResult = await intakeMeeting(notes)
      if ("error" in res) {
        toast.error(translateMessage(t, res.error))
        return
      }
      if ("notConfigured" in res) {
        setState({ status: "notConfigured" })
        return
      }
      setState({ status: "done", content: res.content, items: res.items })
    })
  }

  async function copySummary() {
    if (state.status !== "done") return
    try {
      await navigator.clipboard.writeText(state.content)
      setCopied(true)
      toast.success(t("Copied to clipboard", "คัดลอกแล้ว"))
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error(t("Could not copy — select the text and copy manually.", "คัดลอกไม่สำเร็จ กรุณาเลือกข้อความแล้วคัดลอกเอง"))
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Meeting intake", "สรุปการประชุม")}
        description={t(
          "Paste raw meeting notes and get a clean summary plus action items.",
          "วางบันทึกการประชุม แล้วรับสรุปที่อ่านง่ายพร้อมรายการสิ่งที่ต้องทำ"
        )}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <NotebookPen className="size-4 text-primary" aria-hidden />
              {t("Notes", "บันทึก")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="intake-notes">{t("Meeting notes", "บันทึกการประชุม")}</Label>
              <Textarea
                id="intake-notes"
                rows={12}
                placeholder={t(
                  "Paste what happened in the meeting — decisions, next steps, who owns what…",
                  "วางสิ่งที่เกิดขึ้นในการประชุม — ข้อตัดสินใจ ขั้นตอนถัดไป ใครรับผิดชอบอะไร…"
                )}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <Button
              type="button"
              onClick={submit}
              disabled={pending || notes.trim() === ""}
            >
              {pending ? t("Summarizing…", "กำลังสรุป…") : t("Summarize & extract", "สรุปและดึงรายการงาน")}
            </Button>

            {state.status === "notConfigured" ? (
              <p className="text-muted-foreground rounded-lg border border-dashed p-3 text-sm">
                {t(
                  "AI is not configured — add ANTHROPIC_API_KEY to enable.",
                  "ยังไม่ได้ตั้งค่า AI — เพิ่ม ANTHROPIC_API_KEY เพื่อเปิดใช้งาน"
                )}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ListChecks className="size-4 text-primary" aria-hidden />
              {t("Summary & action items", "สรุปและรายการสิ่งที่ต้องทำ")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {state.status !== "done" ? (
              <EmptyState
                icon={ListChecks}
                title={t("Nothing yet", "ยังไม่มีข้อมูล")}
                description={t("Your summary and action items will appear here.", "สรุปและรายการสิ่งที่ต้องทำจะแสดงที่นี่")}
                className="border-0 p-6"
              />
            ) : (
              <>
                <div className="space-y-2 rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                      {t("Summary", "สรุป")}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={copySummary}
                      aria-label={t("Copy summary", "คัดลอกสรุป")}
                    >
                      {copied ? (
                        <Check className="size-3" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                      {copied ? t("Copied", "คัดลอกแล้ว") : t("Copy", "คัดลอก")}
                    </Button>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {state.content}
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    {t("Action items", "รายการสิ่งที่ต้องทำ")}
                  </span>
                  {state.items.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      {t("No action items were found.", "ไม่พบรายการสิ่งที่ต้องทำ")}
                    </p>
                  ) : (
                    <ul className="divide-y rounded-lg border">
                      {state.items.map((item, i) => (
                        <li key={i} className="p-3 text-sm">
                          {item.title}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
