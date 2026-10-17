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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { addTask } from "../actions"
import { useT } from "@/components/locale-provider"
import { translateMessage } from "@/lib/i18n-messages"
import { enumLabel } from "@/lib/enum-labels"

const Schema = z.object({
  title: z.string().min(1, "Task title is required"),
  status: z.enum(["todo", "in_progress", "done"]),
  dueDate: z.string(),
})
type Values = z.infer<typeof Schema>

const STATUSES = ["todo", "in_progress", "done"] as const

export function AddTaskForm({ projectId }: { projectId: string }) {
  const t = useT()
  const form = useForm<Values>({
    resolver: zodResolver(Schema),
    defaultValues: { title: "", status: "todo", dueDate: "" },
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (v) => {
          const res = await addTask({ projectId, ...v })
          if (res?.error) return toast.error(translateMessage(t, res.error))
          toast.success(t("Task added", "เพิ่มงานย่อยแล้ว"))
          form.reset({ title: "", status: "todo", dueDate: "" })
        })}
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel className="sr-only">{t("Task title", "ชื่องาน")}</FormLabel>
              <FormControl>
                <Input placeholder={t("Add a task…", "เพิ่มงานย่อย…")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">{t("Status", "สถานะ")}</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full sm:w-36">
                    <SelectValue>
                      {(v: Values["status"]) => enumLabel(t, "task_status", v)}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {enumLabel(t, "task_status", s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          <Plus data-icon="inline-start" /> {t("Add task", "เพิ่มงาน")}
        </Button>
      </form>
    </Form>
  )
}
