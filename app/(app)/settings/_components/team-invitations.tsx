"use client"

import { useState, useTransition } from "react"
import { Copy, Mail, Trash2, UserPlus } from "lucide-react"
import { toast } from "sonner"

import { inviteMember, revokeInvitation } from "../org-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/empty-state"
import { useT } from "@/components/locale-provider"
import { translateMessage } from "@/lib/i18n-messages"
import { enumLabel } from "@/lib/enum-labels"

export type PendingInvite = {
  id: string
  email: string
  role: string
  token: string
}

/**
 * Invite teammates by email and manage pending invitations. Owner/admin only
 * (the server actions re-check the role). The invite link is shown after
 * creation so it can be copied and shared (email delivery is optional/separate).
 */
export function TeamInvitations({
  invites,
  appUrl,
}: {
  invites: PendingInvite[]
  appUrl: string
}) {
  const t = useT()
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"member" | "admin">("member")
  const [pending, startTransition] = useTransition()

  function inviteLink(token: string): string {
    const base = appUrl.replace(/\/$/, "")
    return `${base}/invite/${token}`
  }

  async function copy(token: string) {
    try {
      await navigator.clipboard.writeText(inviteLink(token))
      toast.success(t("Invite link copied", "คัดลอกลิงก์คำเชิญแล้ว"))
    } catch {
      toast.error(t("Could not copy — link: ", "คัดลอกไม่สำเร็จ — ลิงก์: ") + inviteLink(token))
    }
  }

  function submit() {
    const value = email.trim()
    if (!value) {
      toast.error(t("Enter an email to invite", "กรุณากรอกอีเมลที่จะเชิญ"))
      return
    }
    startTransition(async () => {
      const res = await inviteMember({ email: value, role })
      if (res?.error) {
        toast.error(translateMessage(t, res.error))
        return
      }
      setEmail("")
      toast.success(t("Invitation created", "สร้างคำเชิญแล้ว"))
      if (res?.token) await copy(res.token)
    })
  }

  function revoke(id: string) {
    startTransition(async () => {
      const res = await revokeInvitation({ id })
      if (res?.error) toast.error(translateMessage(t, res.error))
      else toast.success(t("Invitation revoked", "ยกเลิกคำเชิญแล้ว"))
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          type="email"
          placeholder="teammate@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={pending}
          className="flex-1"
        />
        <Select
          items={[
            { value: "member", label: enumLabel(t, "role_enum", "member") },
            { value: "admin", label: enumLabel(t, "role_enum", "admin") },
          ]}
          value={role}
          onValueChange={(v) => setRole(v as "member" | "admin")}
        >
          <SelectTrigger className="sm:w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="member">{enumLabel(t, "role_enum", "member")}</SelectItem>
            <SelectItem value="admin">{enumLabel(t, "role_enum", "admin")}</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={submit} disabled={pending}>
          <UserPlus /> {t("Invite", "เชิญ")}
        </Button>
      </div>

      {invites.length === 0 ? (
        <EmptyState
          icon={Mail}
          title={t("No pending invitations", "ไม่มีคำเชิญที่รอตอบรับ")}
          description={t("Invite a teammate by email to give them access.", "เชิญเพื่อนร่วมทีมทางอีเมลเพื่อให้สิทธิ์เข้าถึง")}
          className="border-0 p-6"
        />
      ) : (
        <ul className="divide-y">
          {invites.map((inv) => (
            <li key={inv.id} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{inv.email}</p>
                <p className="text-muted-foreground text-xs">{t("Pending", "รอตอบรับ")}</p>
              </div>
              <Badge variant="outline" className="shrink-0 capitalize">
                {enumLabel(t, "role_enum", inv.role)}
              </Badge>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t("Copy invite link", "คัดลอกลิงก์คำเชิญ")}
                onClick={() => copy(inv.token)}
                disabled={pending}
              >
                <Copy />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t("Revoke invitation", "ยกเลิกคำเชิญ")}
                onClick={() => revoke(inv.id)}
                disabled={pending}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
