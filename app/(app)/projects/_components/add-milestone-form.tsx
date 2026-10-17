"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Plus } from "lucide-react"

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { addMilestone } from "../actions"
import { useT } from "@/components/locale-provider"
import { translateMessage } from "@/lib/i18n-messages"

const Schema = z.object({
  title: z.string().min(1, "Milestone title is required"),
  dueDate: z.string(),
})
type Values = z.infer<typeof Schema>

export function AddMilestoneForm({ projectId }: { projectId: string }) {
  const t = useT()
  const form = useForm<Values>({
    resolver: zodResolver(Schema),
    defaultValues: { title: "", dueDate: "" },
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (v) => {
          const res = await addMilestone({ projectId, ...v })
          if (res?.error) return toast.error(translateMessage(t, res.error))
          toast.success(t("Milestone added", "เพิ่มเป้าหมายแล้ว"))
          form.reset({ title: "", dueDate: "" })
        })}
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel className="sr-only">{t("Milestone title", "ชื่อเป้าหมาย")}</FormLabel>
              <FormControl>
                <Input placeholder={t("Add a milestone…", "เพิ่มเป้าหมาย…")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="dueDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">{t("Due date", "วันครบกำหนด")}</FormLabel>
              <FormControl>
                <Input type="date" className="w-full sm:w-40" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          <Plus data-icon="inline-start" /> {t("Add milestone", "เพิ่มเป้าหมาย")}
        </Button>
      </form>
    </Form>
  )
}
