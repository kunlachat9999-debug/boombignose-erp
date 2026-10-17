"use client"

import { useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import { provisionWorkspace } from "@/app/(app)/settings/org-actions"
import { workspaceProvisionRequest, type WorkspaceProvisionRequest } from "@/lib/supabase/workspace-request"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useT } from "@/components/locale-provider"
import { translateMessage } from "@/lib/i18n-messages"

export function WorkspaceForm({ userId }: { userId: string }) {
  const t = useT()
  const [name, setName] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const request = useRef<WorkspaceProvisionRequest | null>(null)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (pending) return
    setPending(true)
    setError(null)
    let storage: Storage | undefined
    try { storage = window.sessionStorage } catch { /* Memory keeps this attempt retryable. */ }
    request.current = workspaceProvisionRequest(userId, name, storage, request.current)
    try {
      const result = await provisionWorkspace(request.current)
      if (result?.error) setError(translateMessage(t, result.error))
    } catch {
      setError(t("Unable to confirm workspace creation. Retry with the same name to continue safely.", "ยืนยันการสร้างพื้นที่ทำงานไม่ได้ กรุณาลองใหม่ด้วยชื่อเดิมเพื่อดำเนินการต่ออย่างปลอดภัย"))
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="workspace-name">{t("Workspace name", "ชื่อพื้นที่ทำงาน")}</Label>
        <Input id="workspace-name" value={name} onChange={(event) => setName(event.target.value)}
          maxLength={100} required autoComplete="organization" disabled={pending}
          placeholder={t("Your service business", "ชื่อธุรกิจของคุณ")} />
      </div>
      {error ? <p role="alert" className="text-destructive text-sm">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={pending || !name.trim()}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : t("Create workspace", "สร้างพื้นที่ทำงาน")}
      </Button>
    </form>
  )
}
