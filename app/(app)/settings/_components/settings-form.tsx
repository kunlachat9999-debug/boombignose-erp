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
import type { UpdateOrgSettingsInput } from "../actions"
import { useT } from "@/components/locale-provider"
import { translateMessage } from "@/lib/i18n-messages"

// The form keeps the baht fields as raw strings (so the burn field can be left
// blank to clear the override, and `field.value` stays a string for <Input>).
// Numbers are coerced when we call the action, which re-validates with zod and
// is the source of truth.
const isMoney = (v: string) => {
  const t = v.trim()
  return t !== "" && Number.isFinite(Number(t)) && Number(t) >= 0
}

const FormSchema = z.object({
  orgName: z.string().min(1, "Workspace name is required"),
  cashBalanceBaht: z
    .string()
    .refine(isMoney, "Enter a valid amount (0 or more)"),
  monthlyBurnBaht: z
    .string()
    .refine(
      (v) => v.trim() === "" || isMoney(v),
      "Enter a valid amount (0 or more)"
    ),
})

type FormValues = z.infer<typeof FormSchema>

export function SettingsForm({
  defaultOrgName,
  defaultCashBaht,
  defaultBurnBaht,
  action,
}: {
  defaultOrgName: string
  defaultCashBaht: number
  defaultBurnBaht: number | null
  action: (input: UpdateOrgSettingsInput) => Promise<{ error?: string }>
}) {
  const t = useT()
  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      orgName: defaultOrgName,
      cashBalanceBaht: String(defaultCashBaht),
      monthlyBurnBaht: defaultBurnBaht === null ? "" : String(defaultBurnBaht),
    },
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (values) => {
          const burn = values.monthlyBurnBaht.trim()
          const res = await action({
            orgName: values.orgName,
            cashBalanceBaht: Number(values.cashBalanceBaht),
            monthlyBurnBaht: burn === "" ? undefined : Number(burn),
          })
          if (res?.error) return toast.error(translateMessage(t, res.error))
          toast.success(t("Settings saved", "บันทึกการตั้งค่าแล้ว"))
        })}
        className="space-y-5"
      >
        <FormField
          control={form.control}
          name="orgName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("Workspace name", "ชื่อพื้นที่ทำงาน")}</FormLabel>
              <FormControl>
                <Input placeholder="BoomBigNose" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cashBalanceBaht"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("Cash balance (฿)", "ยอดเงินสด (฿)")}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {t(
                  "Your current bank balance. Powers cash & runway on the dashboard.",
                  "ยอดเงินในบัญชีปัจจุบัน ใช้คำนวณเงินสดและระยะเวลาเงินสำรองในแดชบอร์ด"
                )}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="monthlyBurnBaht"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("Monthly burn override (฿)", "กำหนดรายจ่ายต่อเดือนเอง (฿)")}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  placeholder={t("Leave blank to use actual burn", "เว้นว่างไว้เพื่อใช้รายจ่ายจริง")}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {t(
                  "Optional. Set a fixed monthly burn for runway; leave blank to use your actual recorded costs.",
                  "ไม่บังคับ กำหนดรายจ่ายคงที่ต่อเดือนเพื่อคำนวณระยะเวลาเงินสำรอง หรือเว้นว่างเพื่อใช้ค่าใช้จ่ายจริงที่บันทึกไว้"
                )}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting
            ? t("Saving…", "กำลังบันทึก…")
            : t("Save changes", "บันทึกการเปลี่ยนแปลง")}
        </Button>
      </form>
    </Form>
  )
}
