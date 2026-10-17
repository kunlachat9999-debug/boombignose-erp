"use client"

import { useState, useTransition } from "react"
import { Copy, RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

import {
  enableClientPortal,
  disableClientPortal,
  regeneratePortalToken,
} from "../portal-actions"
import { useT } from "@/components/locale-provider"
import { translateMessage } from "@/lib/i18n-messages"

export function PortalShareCard({
  clientId,
  portalEnabled,
  portalToken,
  appUrl,
}: {
  clientId: string
  portalEnabled: boolean
  portalToken: string | null
  appUrl: string
}) {
  const [enabled, setEnabled] = useState(portalEnabled)
  const [token, setToken] = useState(portalToken)
  const [pending, startTransition] = useTransition()
  const t = useT()

  const link = token && appUrl ? `${appUrl}/portal/${token}` : ""

  function handleToggle(next: boolean) {
    startTransition(async () => {
      if (next) {
        const res = await enableClientPortal(clientId)
        if (res.error) {
          toast.error(translateMessage(t, res.error))
          return
        }
        setEnabled(true)
        if (res.token) setToken(res.token)
        toast.success(t("Client portal enabled", "เปิดพอร์ทัลลูกค้าแล้ว"))
      } else {
        const res = await disableClientPortal(clientId)
        if (res.error) {
          toast.error(translateMessage(t, res.error))
          return
        }
        setEnabled(false)
        toast.success(t("Client portal disabled", "ปิดพอร์ทัลลูกค้าแล้ว"))
      }
    })
  }

  function handleRegenerate() {
    startTransition(async () => {
      const res = await regeneratePortalToken(clientId)
      if (res?.error) {
        toast.error(translateMessage(t, res.error))
        return
      }
      setEnabled(true)
      if (res.token) setToken(res.token)
      toast.success(t("Portal link regenerated", "สร้างลิงก์พอร์ทัลใหม่แล้ว"))
    })
  }

  async function handleCopy() {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      toast.success(t("Link copied", "คัดลอกลิงก์แล้ว"))
    } catch {
      toast.error(t("Could not copy the link", "คัดลอกลิงก์ไม่สำเร็จ"))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <Label htmlFor="portal-toggle">{t("Enable portal", "เปิดใช้พอร์ทัล")}</Label>
          <p className="text-muted-foreground text-sm">
            {t(
              "Give this client a private, read-only link to their quotes, invoices, and projects.",
              "ให้ลิงก์ส่วนตัวแบบดูอย่างเดียวแก่ลูกค้า เพื่อดูใบเสนอราคา ใบแจ้งหนี้ และโปรเจกต์ของตน"
            )}
          </p>
        </div>
        <Switch
          id="portal-toggle"
          checked={enabled}
          onCheckedChange={handleToggle}
          disabled={pending}
        />
      </div>

      {enabled && link ? (
        <div className="space-y-2">
          <Label htmlFor="portal-link">{t("Portal link", "ลิงก์พอร์ทัล")}</Label>
          <div className="flex items-center gap-2">
            <Input id="portal-link" readOnly value={link} />
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={t("Copy portal link", "คัดลอกลิงก์พอร์ทัล")}
              onClick={handleCopy}
            >
              <Copy />
            </Button>
          </div>
          <p className="text-muted-foreground text-xs">
            {t(
              "Anyone with this link can view the portal. Regenerate to revoke the old link.",
              "ทุกคนที่มีลิงก์นี้ดูพอร์ทัลได้ สร้างลิงก์ใหม่เพื่อยกเลิกลิงก์เดิม"
            )}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRegenerate}
            disabled={pending}
          >
            <RefreshCw /> {t("Regenerate link", "สร้างลิงก์ใหม่")}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
