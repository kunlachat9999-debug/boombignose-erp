"use client"

import { useRouter } from "next/navigation"
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
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

import { SelectField, type Option } from "./form-fields"
import { useT } from "@/components/locale-provider"
import { translateMessage } from "@/lib/i18n-messages"
import { enumLabel } from "@/lib/enum-labels"
import { Constants } from "@/lib/types/database"

const Schema = z.object({
  name: z.string().min(1, "Name is required"),
  client_id: z.string().min(1, "Choose a client"),
  project_id: z.string().optional(),
  amountBaht: z.coerce.number().min(0, "Amount must be 0 or more"),
  interval: z.enum(["weekly", "monthly", "quarterly", "yearly"]),
  start_date: z.string().optional(),
  notes: z.string().optional(),
})

type Values = z.infer<typeof Schema>
export type SubscriptionFormSubmitValues = Values

export type SubscriptionFormValues = {
  name: string
  client_id: string
  project_id: string
  amountBaht: number
  interval: Values["interval"]
  start_date: string
  notes: string
}

export function SubscriptionForm({
  clients,
  projects,
  defaultValues,
  submitLabel,
  action,
}: {
  clients: Option[]
  projects: Option[]
  defaultValues: SubscriptionFormValues
  submitLabel: string
  action: (values: Values) => Promise<{ error?: string } | void>
}) {
  const router = useRouter()
  const t = useT()
  const intervalOptions: Option[] = Constants.public.Enums.recurring_interval.map((v) => ({
    value: v,
    label: enumLabel(t, "recurring_interval", v),
  }))
  const form = useForm<z.input<typeof Schema>, unknown, Values>({
    resolver: zodResolver(Schema),
    defaultValues,
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (values) => {
          const res = await action(values)
          if (res?.error) {
            toast.error(translateMessage(t, res.error))
            return
          }
          // createSubscription redirects on success (no return); update returns {}.
          toast.success(t("Subscription saved", "บันทึกรายการสมัครสมาชิกแล้ว"))
          router.refresh()
        })}
        className="space-y-5"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("Name", "ชื่อ")}</FormLabel>
              <FormControl>
                <Input placeholder={t("Acme monthly retainer", "ค่าบริการรายเดือน บริษัท ตัวอย่าง")} {...field} />
              </FormControl>
              <FormDescription>
                {t("Shown on generated invoices as the number prefix.", "แสดงเป็นคำนำหน้าเลขที่ในใบแจ้งหนี้ที่สร้าง")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField
            name="client_id"
            label={t("Client", "ลูกค้า")}
            placeholder={t("Select a client", "เลือกลูกค้า")}
            options={clients}
          />
          <SelectField
            name="project_id"
            label={t("Project", "โปรเจกต์")}
            placeholder={t("No project", "ไม่ระบุโปรเจกต์")}
            options={projects}
            optional
            noneLabel={t("No project", "ไม่ระบุโปรเจกต์")}
            description={t("Optional — link to a project.", "ไม่บังคับ — ผูกกับโปรเจกต์")}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="amountBaht"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("Amount (฿)", "จำนวนเงิน (฿)")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    inputMode="decimal"
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={(field.value ?? "") as number | string}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormDescription>{t("Billed each interval.", "เรียกเก็บทุกรอบ")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <SelectField
            name="interval"
            label={t("Interval", "รอบ")}
            placeholder={t("Select interval", "เลือกรอบ")}
            options={intervalOptions}
          />
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("Start date", "วันที่เริ่ม")}</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormDescription>{t("First run date.", "วันที่เริ่มรอบแรก")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("Notes", "หมายเหตุ")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("Anything worth remembering about this subscription…", "สิ่งที่ควรจำเกี่ยวกับรายการนี้…")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  )
}
