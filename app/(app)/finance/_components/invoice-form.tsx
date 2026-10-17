"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { moneyInput } from "@/lib/payments/input"
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
import { Switch } from "@/components/ui/switch"

import { SelectField, type Option } from "./form-fields"
import { useT } from "@/components/locale-provider"
import { translateMessage } from "@/lib/i18n-messages"
import { enumLabel } from "@/lib/enum-labels"
import { Constants } from "@/lib/types/database"

const Schema = z
  .object({
    client_id: z.string().min(1, "Choose a client"),
    project_id: z.string().optional(),
    number: z.string().optional(),
    status: z.enum([
      "draft",
      "sent",
      "partially_paid",
      "paid",
      "overdue",
      "cancelled",
    ]),
    issue_date: z.string().optional(),
    due_date: z.string().optional(),
    amountBaht: z.string().refine(v => { try { moneyInput(v); return true } catch { return false } }, "Enter an exact THB amount with up to two decimals"),
    is_recurring: z.boolean(),
    recurring_interval: z
      .enum(["weekly", "monthly", "quarterly", "yearly"])
      .optional(),
    notes: z.string().optional(),
  })
  .refine((v) => !v.is_recurring || !!v.recurring_interval, {
    path: ["recurring_interval"],
    message: "Pick an interval for recurring invoices",
  })

type Values = z.infer<typeof Schema>
/** The exact payload shape `action` receives on submit (Zod output of the form
 * schema — note `project_id` is optional here, unlike `InvoiceFormValues`). */
export type InvoiceFormSubmitValues = Values

export type InvoiceFormValues = {
  client_id: string
  project_id: string
  number: string
  status: Values["status"]
  issue_date: string
  due_date: string
  amountBaht: string
  is_recurring: boolean
  recurring_interval?: Values["recurring_interval"]
  notes: string
}

export function InvoiceForm({
  clients,
  projects,
  defaultValues,
  submitLabel,
  action,
}: {
  clients: Option[]
  projects: Option[]
  defaultValues: InvoiceFormValues
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

  // eslint-disable-next-line react-hooks/incompatible-library -- watch() is RHF's intended API
  const isRecurring = form.watch("is_recurring")

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (values) => {
          const payload = {
            ...values,
            recurring_interval: values.is_recurring
              ? values.recurring_interval
              : undefined,
          }
          const res = await action(payload)
          if (res?.error) {
            toast.error(translateMessage(t, res.error))
            return
          }
          // createInvoice redirects on success (no return); update returns {}.
          toast.success(t("Invoice saved", "บันทึกใบแจ้งหนี้แล้ว"))
          router.refresh()
        })}
        className="space-y-5"
      >
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

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("Invoice number", "เลขที่ใบแจ้งหนี้")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("Auto (INV-2026-00X)", "อัตโนมัติ (INV-2026-00X)")} {...field} />
                </FormControl>
                <FormDescription>
                  {t("Leave blank to auto-number.", "เว้นว่างไว้เพื่อให้ระบบรันเลขให้")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField control={form.control} name="status" render={({ field }) => <FormItem><FormLabel>{t("Status", "สถานะ")}</FormLabel><FormControl><Input name={field.name} ref={field.ref} value={enumLabel(t, "invoice_status", field.value)} readOnly /></FormControl><FormDescription>{t("Payment status is derived from verified receipts. Use the issue action to issue a draft.", "สถานะการชำระคำนวณจากยอดรับชำระที่ตรวจสอบแล้ว ใช้ปุ่มออกใบแจ้งหนี้เพื่อออกฉบับร่าง")}</FormDescription></FormItem>} />
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="issue_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("Issue date", "วันที่ออก")}</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="due_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("Due date", "วันครบกำหนด")}</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
                <FormDescription>{t("Entered in baht.", "กรอกเป็นบาท")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="is_recurring"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel>{t("Recurring invoice", "ใบแจ้งหนี้ประจำ")}</FormLabel>
                <FormDescription>
                  {t("Bills the client on a repeating schedule.", "เรียกเก็บเงินลูกค้าตามรอบที่กำหนด")}
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {isRecurring ? (
          <SelectField
            name="recurring_interval"
            label={t("Recurring interval", "รอบการออก")}
            placeholder={t("Select interval", "เลือกรอบ")}
            options={intervalOptions}
          />
        ) : null}

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("Notes", "หมายเหตุ")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("Anything worth remembering about this invoice…", "สิ่งที่ควรจำเกี่ยวกับใบแจ้งหนี้นี้…")}
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
