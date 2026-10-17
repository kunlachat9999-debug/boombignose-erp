"use client"

import * as React from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createCategory } from "../actions"
import { useT } from "@/components/locale-provider"
import { translateMessage } from "@/lib/i18n-messages"

/** Preview the slug we'll store, so founders see what gets created. */
function slugPreview(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function NewCategoryDialog() {
  const t = useT()
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState("")
  const [pending, setPending] = React.useState(false)

  const slug = slugPreview(name)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    const res = await createCategory({ name })
    setPending(false)
    if (res?.error) {
      toast.error(translateMessage(t, res.error))
      return
    }
    toast.success(t("Category created", "สร้างหมวดหมู่แล้ว"))
    setName("")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <Plus /> {t("New category", "เพิ่มหมวดหมู่")}
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>{t("New category", "เพิ่มหมวดหมู่")}</DialogTitle>
            <DialogDescription>
              {t("Group templates so they are easy to browse.", "จัดกลุ่มเทมเพลตให้ค้นหาง่าย")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            <Label htmlFor="category-name">{t("Name", "ชื่อ")}</Label>
            <Input
              id="category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("e.g. Sales & Support", "เช่น งานขายและบริการ")}
              autoFocus
            />
            {slug ? (
              <p className="text-muted-foreground text-xs">
                {t("Slug: ", "ชื่อในลิงก์: ")}<span className="font-mono">{slug}</span>
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              {t("Cancel", "ยกเลิก")}
            </DialogClose>
            <Button type="submit" disabled={pending || slug.length === 0}>
              {t("Create", "สร้าง")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
