"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { useT } from "@/components/locale-provider"
import { enumLabel } from "@/lib/enum-labels"
import { translateMessage } from "@/lib/i18n-messages"
import { Constants } from "@/lib/types/database"

const Schema = z.object({
  clientId: z.string().min(1, "Pick a client"),
  title: z.string().min(1, "Title is required"),
  stage: z.enum([
    "lead",
    "contacted",
    "discovery",
    "proposal",
    "negotiation",
    "won",
    "lost",
  ]),
  valueBaht: z.coerce.number().min(0, "Value can't be negative"),
  expectedCloseDate: z.string().optional(),
  nextFollowUpDate: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
})

export type DealFormValues = z.infer<typeof Schema>

export function DealForm({
  clients,
  action,
  defaultValues,
  submitLabel,
}: {
  clients: { id: string; name: string }[]
  action: (values: DealFormValues) => Promise<{ error?: string }>
  defaultValues?: Partial<DealFormValues>
  submitLabel?: string
}) {
  const router = useRouter()
  const t = useT()
  const stages = Constants.public.Enums.deal_stage.map((s) => ({
    value: s,
    label: enumLabel(t, "deal_stage", s),
  }))
  const form = useForm<z.input<typeof Schema>, unknown, DealFormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      clientId: "",
      title: "",
      stage: "lead",
      valueBaht: 0,
      expectedCloseDate: "",
      nextFollowUpDate: "",
      source: "",
      notes: "",
      ...defaultValues,
    },
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (values) => {
          const res = await action(values)
          // On success the action redirects; only an error returns here.
          if (res?.error) {
            toast.error(translateMessage(t, res.error))
            return
          }
          toast.success(t("Saved", "บันทึกแล้ว"))
          router.refresh()
        })}
        className="space-y-5"
      >
        <FormField
          control={form.control}
          name="clientId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("Client", "ลูกค้า")}</FormLabel>
              <Select
                items={clients.map((c) => ({ value: c.id, label: c.name }))}
                value={field.value || null}
                onValueChange={(value) => field.onChange(value ?? "")}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("Select a client", "เลือกลูกค้า")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
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
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("Title", "ชื่อดีล")}</FormLabel>
              <FormControl>
                <Input placeholder={t("e.g. Website automation retainer", "เช่น สัญญาดูแลระบบอัตโนมัติเว็บไซต์")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="stage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("Stage", "ขั้นตอน")}</FormLabel>
                <Select
                  items={stages}
                  value={field.value}
                  onValueChange={(value) => field.onChange(value)}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("Stage", "ขั้นตอน")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {stages.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
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
            name="valueBaht"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("Value (THB)", "มูลค่า (บาท)")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    placeholder="0"
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={(field.value ?? "") as number | string}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="expectedCloseDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("Expected close date", "วันที่คาดว่าจะปิด")}</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nextFollowUpDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("Next follow-up date", "วันที่ติดตามครั้งถัดไป")}</FormLabel>
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
          name="source"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("Source", "แหล่งที่มา")}</FormLabel>
              <FormControl>
                <Input placeholder={t("e.g. Referral, LINE, Facebook", "เช่น มีคนแนะนำ, LINE, Facebook")} {...field} />
              </FormControl>
              <FormMessage />
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
                <Textarea rows={4} placeholder={t("Context, next steps, anything useful…", "ที่มา ขั้นตอนถัดไป หรือข้อมูลที่มีประโยชน์…")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {submitLabel ?? t("Save deal", "บันทึกดีล")}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            {t("Cancel", "ยกเลิก")}
          </Button>
        </div>
      </form>
    </Form>
  )
}
