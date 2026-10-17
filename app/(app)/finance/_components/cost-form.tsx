"use client"

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

import { SelectField, type Option } from "./form-fields"
import { useT } from "@/components/locale-provider"
import { translateMessage } from "@/lib/i18n-messages"
import { enumLabel } from "@/lib/enum-labels"
import { Constants } from "@/lib/types/database"

const Schema = z.object({
  category: z.enum([
    "software",
    "contractor",
    "infra",
    "marketing",
    "salary",
    "other",
  ]),
  amountBaht: z.string().refine(v => { try { moneyInput(v); return true } catch { return false } }, "Enter an exact THB amount with up to two decimals"),
  incurred_on: z.string().optional(),
  vendor: z.string().optional(),
  project_id: z.string().optional(),
  notes: z.string().optional(),
})

type Values = z.infer<typeof Schema>

export function CostForm({
  projects,
  today,
  action,
}: {
  projects: Option[]
  today: string
  action: (values: Values) => Promise<{ error?: string } | void>
}) {
  const t = useT()
  const categoryOptions: Option[] = Constants.public.Enums.cost_category.map((v) => ({
    value: v,
    label: enumLabel(t, "cost_category", v),
  }))
  const form = useForm<z.input<typeof Schema>, unknown, Values>({
    resolver: zodResolver(Schema),
    defaultValues: {
      category: "other",
      amountBaht: "0.00",
      incurred_on: today,
      vendor: "",
      project_id: "",
      notes: "",
    },
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
          toast.success(t("Cost saved", "บันทึกค่าใช้จ่ายแล้ว"))
        })}
        className="space-y-5"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField
            name="category"
            label={t("Category", "หมวดหมู่")}
            placeholder={t("Select category", "เลือกหมวดหมู่")}
            options={categoryOptions}
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

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="incurred_on"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("Incurred on", "วันที่เกิดค่าใช้จ่าย")}</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="vendor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("Vendor", "ผู้ขาย")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("e.g. Figma, AWS, freelancer…", "เช่น Figma, AWS, ฟรีแลนซ์…")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <SelectField
          name="project_id"
          label={t("Project", "โปรเจกต์")}
          placeholder={t("No project", "ไม่ระบุโปรเจกต์")}
          options={projects}
          optional
          noneLabel={t("No project", "ไม่ระบุโปรเจกต์")}
          description={t("Optional — attribute this cost to a project.", "ไม่บังคับ — ระบุว่าค่าใช้จ่ายนี้เป็นของโปรเจกต์ใด")}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("Notes", "หมายเหตุ")}</FormLabel>
              <FormControl>
                <Textarea placeholder={t("What was this for?", "ใช้จ่ายเพื่ออะไร?")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {t("Save cost", "บันทึกค่าใช้จ่าย")}
          </Button>
        </div>
      </form>
    </Form>
  )
}
