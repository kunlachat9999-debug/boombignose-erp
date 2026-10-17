"use client"

import Link from "next/link"
import { useTransition } from "react"
import { Bookmark, Check, Trash2, ChevronDown } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

import { deleteSavedView } from "./actions"
import { configToHref, type ViewConfig } from "./view-config"
import { useT } from "@/components/locale-provider"
import { translateMessage } from "@/lib/i18n-messages"

export type SavedView = {
  id: string
  name: string
  config: ViewConfig
}

/**
 * Dropdown listing the user's saved views for this module. Each item is a link
 * that applies the stored filters as URL params; a trash icon removes it. The
 * active view (config matches the current filters) is ticked.
 */
export function SavedViewsMenu({
  views,
  basePath,
  activeConfig,
}: {
  views: SavedView[]
  basePath: string
  activeConfig: ViewConfig
}) {
  const [pending, startTransition] = useTransition()
  const t = useT()
  const activeKey = configToHref(basePath, activeConfig)

  if (views.length === 0) return null

  function handleDelete(id: string, name: string) {
    startTransition(async () => {
      const res = await deleteSavedView(id)
      if (res?.error) {
        toast.error(translateMessage(t, res.error))
        return
      }
      toast.success(t(`Removed “${name}”`, `ลบ “${name}” แล้ว`))
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm">
            <Bookmark />
            {t("Saved views", "มุมมองที่บันทึกไว้")}
            <ChevronDown className="text-muted-foreground" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{t("Saved views", "มุมมองที่บันทึกไว้")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {views.map((view) => {
          const href = configToHref(basePath, view.config)
          const isActive = href === activeKey
          return (
            <div
              key={view.id}
              className="flex items-center gap-1 pr-1"
            >
              <DropdownMenuItem
                closeOnClick
                render={
                  <Link href={href} className="flex-1">
                    <Check
                      className={cn(
                        "size-4",
                        isActive ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="flex-1 truncate">{view.name}</span>
                  </Link>
                }
              />
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={t(`Delete view ${view.name}`, `ลบมุมมอง ${view.name}`)}
                disabled={pending}
                onClick={() => handleDelete(view.id, view.name)}
              >
                <Trash2 className="text-muted-foreground" />
              </Button>
            </div>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
