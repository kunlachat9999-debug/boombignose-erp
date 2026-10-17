"use client"

import { useState, useTransition } from "react"
import { BookmarkPlus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"

import { createSavedView } from "./actions"
import { isEmptyConfig, type ViewConfig } from "./view-config"
import { useT } from "@/components/locale-provider"
import { translateMessage } from "@/lib/i18n-messages"

/**
 * "Save this view" control. Captures the currently-active filters (passed in as
 * `config`) under a name. Disabled when no filter is active — there's nothing
 * worth saving for the default, unfiltered view.
 */
export function SaveViewButton({
  module,
  config,
}: {
  module: "deals" | "finance" | "clients"
  config: ViewConfig
}) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [pending, startTransition] = useTransition()
  const noFilters = isEmptyConfig(config)

  function handleSave() {
    const trimmed = name.trim()
    if (!trimmed) {
      toast.error(t("Give your view a name", "กรุณาตั้งชื่อมุมมอง"))
      return
    }
    startTransition(async () => {
      const res = await createSavedView({ module, name: trimmed, config })
      if (res?.error) {
        toast.error(translateMessage(t, res.error))
        return
      }
      toast.success(t(`Saved view “${trimmed}”`, `บันทึกมุมมอง “${trimmed}” แล้ว`))
      setName("")
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" disabled={noFilters}>
            <BookmarkPlus />
            {t("Save view", "บันทึกมุมมอง")}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("Save this view", "บันทึกมุมมองนี้")}</DialogTitle>
          <DialogDescription>
            {t("Save the current filters so you can jump back to them later.", "บันทึกตัวกรองปัจจุบันไว้เพื่อกลับมาใช้ภายหลัง")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="saved-view-name">{t("View name", "ชื่อมุมมอง")}</Label>
          <Input
            id="saved-view-name"
            value={name}
            placeholder={t("e.g. Hot deals", "เช่น ดีลที่น่าสนใจ")}
            autoFocus
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleSave()
              }
            }}
          />
        </div>
        <DialogFooter>
          <DialogClose
            render={
              <Button variant="ghost" size="sm">
                {t("Cancel", "ยกเลิก")}
              </Button>
            }
          />
          <Button size="sm" disabled={pending} onClick={handleSave}>
            {t("Save", "บันทึก")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
