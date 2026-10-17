"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Clock } from "lucide-react"

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

import { logTime } from "../actions"
import { SelectField, type Option } from "./form-fields"
import { useT } from "@/components/locale-provider"
import { translateMessage } from "@/lib/i18n-messages"

const Schema = z.object({
  project_id: z.string().min(1, "Choose a project"),
  work_date: z.string().optional(),
  hours: z.coerce.number().min(0, "Hours must be 0 or more"),
  billable: z.boolean(),
  rateBaht: z.union([z.coerce.number().min(0), z.literal("")]).optional(),
  notes: z.string().optional(),
})

type Values = z.infer<typeof Schema>

export function LogTimeForm({
  projects,
  defaultProjectId,
  defaultWorkDate,
  lockProject = false,
}: {
  projects: Option[]
  defaultProjectId?: string
  defaultWorkDate: string
  /** Hide the project select and always log against `defaultProjectId`. */
  lockProject?: boolean
}) {
  const router = useRouter()
  const t = useT()
  const form = useForm<z.input<typeof Schema>, unknown, Values>({
    resolver: zodResolver(Schema),
    defaultValues: {
      project_id: defaultProjectId ?? "",
      work_date: defaultWorkDate,
      hours: 1,
      billable: true,
      rateBaht: "",
      notes: "",
    },
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (values) => {
          const res = await logTime({
            project_id: values.project_id,
            work_date: values.work_date,
            hours: values.hours,
            billable: values.billable,
            rateBaht: values.rateBaht === "" ? undefined : values.rateBaht,
            notes: values.notes,
          })
          if (res?.error) {
            toast.error(translateMessage(t, res.error))
            return
          }
          toast.success(t("Time logged", "บันทึกเวลาแล้ว"))
          form.reset({
            project_id: defaultProjectId ?? "",
            work_date: defaultWorkDate,
            hours: 1,
            billable: true,
            rateBaht: "",
            notes: "",
          })
          router.refresh()
        })}
        className="space-y-5"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          {lockProject ? null : (
            <SelectField
              name="project_id"
              label={t("Project", "โปรเจกต์")}
              placeholder={t("Select a project", "เลือกโปรเจกต์")}
              options={projects}
            />
          )}
          <FormField
            control={form.control}
            name="work_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("Work date", "วันที่ทำงาน")}</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="hours"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("Hours", "ชั่วโมง")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step="0.25"
                    inputMode="decimal"
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={(field.value ?? "") as number | string}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormDescription>{t("Decimal hours (e.g. 1.5).", "ชั่วโมงแบบทศนิยม (เช่น 1.5)")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="rateBaht"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("Rate (฿/hr)", "อัตรา (฿/ชม.)")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    inputMode="decimal"
                    placeholder={t("Optional", "ไม่บังคับ")}
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={(field.value ?? "") as number | string}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormDescription>{t("Per hour, for billable value.", "ต่อชั่วโมง ใช้คำนวณมูลค่าที่เรียกเก็บได้")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="billable"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel>{t("Billable", "เรียกเก็บได้")}</FormLabel>
                <FormDescription>
                  {t(
                    "Counts toward billable value and utilization.",
                    "นับรวมในมูลค่าที่เรียกเก็บได้และอัตราการใช้เวลา"
                  )}
                </FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("Notes", "บันทึก")}</FormLabel>
              <FormControl>
                <Textarea placeholder={t("What did you work on?", "ทำงานอะไรไปบ้าง?")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            <Clock data-icon="inline-start" /> {t("Log time", "บันทึกเวลา")}
          </Button>
        </div>
      </form>
    </Form>
  )
}
