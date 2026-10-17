"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
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
import { serviceMoneyInput } from "@/lib/workflows/service"
import { Constants, type Enums } from "@/lib/types/database"
import { useT } from "@/components/locale-provider"
import { translateMessage } from "@/lib/i18n-messages"
import { enumLabel } from "@/lib/enum-labels"

type ProjectStatus = Enums<"project_status">

const NONE = "none"

const FormSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  clientId: z.string(),
  status: z.enum([
    "not_started",
    "in_progress",
    "review",
    "delivered",
    "support",
    "paused",
    "cancelled",
  ]),
  deadline: z.string(),
  budgetBaht: serviceMoneyInput,
  owner: z.string(),
})

type FormInput = z.input<typeof FormSchema>
export type ProjectFormValues = z.output<typeof FormSchema>

export type ClientOption = { id: string; name: string }

export function ProjectForm({
  action,
  clients,
  defaultValues,
  submitLabel,
}: {
  action: (values: ProjectFormValues) => Promise<{ error?: string }>
  clients: ClientOption[]
  defaultValues?: Partial<FormInput>
  submitLabel?: string
}) {
  const t = useT()
  const form = useForm<FormInput, unknown, ProjectFormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
      clientId: NONE,
      status: "not_started",
      deadline: "",
      budgetBaht: 0,
      owner: "",
      ...defaultValues,
    },
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (values) => {
          const res = await action(values)
          // On success the action redirects (throws), so we only reach here on error.
          if (res?.error) toast.error(translateMessage(t, res.error))
        })}
        className="space-y-5"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("Project name", "ชื่อโปรเจกต์")}</FormLabel>
              <FormControl>
                <Input placeholder={t("e.g. Website automation", "เช่น ระบบอัตโนมัติเว็บไซต์")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="clientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("Client", "ลูกค้า")}</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(v) => field.onChange(v ?? NONE)}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("No client", "ไม่ระบุลูกค้า")}>
                        {(v: string | null) =>
                          (v && v !== NONE && clients.find((c) => c.id === v)?.name) ||
                          t("No client", "ไม่ระบุลูกค้า")
                        }
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={NONE}>{t("No client", "ไม่ระบุลูกค้า")}</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("Status", "สถานะ")}</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(v) => field.onChange(v)}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {(v: ProjectStatus) => enumLabel(t, "project_status", v)}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Constants.public.Enums.project_status.map((s) => (
                      <SelectItem key={s} value={s}>
                        {enumLabel(t, "project_status", s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="deadline"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("Deadline", "กำหนดส่ง")}</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="budgetBaht"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("Budget (THB)", "งบประมาณ (บาท)")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    inputMode="decimal"
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={(field.value as number | string | undefined) ?? ""}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormDescription>
                  {t("Total project budget in baht.", "งบประมาณรวมของโปรเจกต์ (บาท)")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="owner"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("Owner", "ผู้รับผิดชอบ")}</FormLabel>
              <FormControl>
                <Input placeholder={t("Who owns delivery?", "ใครรับผิดชอบงานส่งมอบ?")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {submitLabel ?? t("Create project", "สร้างโปรเจกต์")}
          </Button>
        </div>
      </form>
    </Form>
  )
}
