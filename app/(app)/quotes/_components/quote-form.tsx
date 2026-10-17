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

import { serviceMoneyInput } from "@/lib/workflows/service"

import { SelectField, type Option } from "./form-fields"
import { useT } from "@/components/locale-provider"
import { translateMessage } from "@/lib/i18n-messages"

const Schema = z.object({
  client_id: z.string().min(1, "Choose a client"),
  project_id: z.string().optional(),
  number: z.string().optional(),
  issue_date: z.string().optional(),
  valid_until: z.string().optional(),
  discountBaht: serviceMoneyInput,
  notes: z.string().optional(),
})

type Values = z.infer<typeof Schema>
/** The exact payload shape `action` receives on submit (Zod output of the form). */
export type QuoteFormSubmitValues = Values

export type QuoteFormValues = {
  client_id: string
  project_id: string
  number: string
  issue_date: string
  valid_until: string
  discountBaht: number | string
  notes: string
}

export function QuoteForm({
  clients,
  projects,
  defaultValues,
  submitLabel,
  action,
}: {
  clients: Option[]
  projects: Option[]
  defaultValues: QuoteFormValues
  submitLabel: string
  action: (values: Values) => Promise<{ error?: string } | void>
}) {
  const router = useRouter()
  const t = useT()
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
          // createQuote redirects on success (no return); update returns {}.
          toast.success(t("Quote saved", "บันทึกใบเสนอราคาแล้ว"))
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
                <FormLabel>{t("Quote number", "เลขที่ใบเสนอราคา")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("Auto (QUO-2026-00X)", "อัตโนมัติ (QUO-2026-00X)")} {...field} />
                </FormControl>
                <FormDescription>
                  {t("Leave blank to auto-number.", "เว้นว่างไว้เพื่อให้ระบบรันเลขให้")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="discountBaht"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("Discount (฿)", "ส่วนลด (฿)")}</FormLabel>
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
                <FormDescription>
                  {t("Absolute amount off the subtotal.", "จำนวนเงินที่หักจากยอดก่อนส่วนลด")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
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
            name="valid_until"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("Valid until", "ใช้ได้ถึง")}</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
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
                  placeholder={t("Scope, assumptions, terms…", "ขอบเขตงาน สมมติฐาน เงื่อนไข…")}
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
