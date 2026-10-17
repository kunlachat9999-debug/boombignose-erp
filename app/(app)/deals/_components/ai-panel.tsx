"use client"

import { useState, useTransition } from "react"
import { Sparkles, MessageSquareText, Copy, Check } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { summarizeDeal, draftFollowup, type AIResult } from "../ai-actions"
import { useT } from "@/components/locale-provider"
import { translateMessage } from "@/lib/i18n-messages"

type Panel = {
  content: string | null
  notConfigured: boolean
}

const EMPTY: Panel = { content: null, notConfigured: false }

export function AiPanel({ dealId }: { dealId: string }) {
  const t = useT()
  const [panel, setPanel] = useState<Panel>(EMPTY)
  const [pending, startTransition] = useTransition()
  const [action, setAction] = useState<"summary" | "followup" | null>(null)
  const [copied, setCopied] = useState(false)

  function run(kind: "summary" | "followup") {
    setAction(kind)
    setCopied(false)
    startTransition(async () => {
      const res: AIResult =
        kind === "summary"
          ? await summarizeDeal(dealId)
          : await draftFollowup(dealId)

      if ("error" in res) {
        toast.error(translateMessage(t, res.error))
        return
      }
      if ("notConfigured" in res) {
        setPanel({ content: null, notConfigured: true })
        return
      }
      setPanel({ content: res.content, notConfigured: false })
    })
  }

  async function copy() {
    if (!panel.content) return
    try {
      await navigator.clipboard.writeText(panel.content)
      setCopied(true)
      toast.success(t("Copied to clipboard", "คัดลอกแล้ว"))
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error(t("Could not copy — select the text and copy manually.", "คัดลอกไม่สำเร็จ กรุณาเลือกข้อความแล้วคัดลอกเอง"))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4 text-primary" aria-hidden />
          {t("AI assist", "ผู้ช่วย AI")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => run("summary")}
          >
            <Sparkles className="size-3.5" />
            {pending && action === "summary"
              ? t("Summarizing…", "กำลังสรุป…")
              : t("Summarize deal", "สรุปดีล")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => run("followup")}
          >
            <MessageSquareText className="size-3.5" />
            {pending && action === "followup"
              ? t("Drafting…", "กำลังร่าง…")
              : t("Draft follow-up", "ร่างข้อความติดตาม")}
          </Button>
        </div>

        {panel.notConfigured ? (
          <p className="text-muted-foreground rounded-lg border border-dashed p-3 text-sm">
            {t(
              "AI is not configured — add ANTHROPIC_API_KEY to enable.",
              "ยังไม่ได้ตั้งค่า AI — เพิ่ม ANTHROPIC_API_KEY เพื่อเปิดใช้งาน"
            )}
          </p>
        ) : null}

        {panel.content ? (
          <div className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                {action === "followup"
                  ? t("Draft follow-up", "ร่างข้อความติดตาม")
                  : t("Summary", "สรุป")}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={copy}
                aria-label={t("Copy to clipboard", "คัดลอก")}
              >
                {copied ? (
                  <Check className="size-3" />
                ) : (
                  <Copy className="size-3" />
                )}
                {copied ? t("Copied", "คัดลอกแล้ว") : t("Copy", "คัดลอก")}
              </Button>
            </div>
            <p className={cn("whitespace-pre-wrap text-sm leading-relaxed")}>
              {panel.content}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
