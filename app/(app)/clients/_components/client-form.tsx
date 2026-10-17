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
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useT } from "@/components/locale-provider"
import { translateMessage } from "@/lib/i18n-messages"

const ClientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  industry: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
})

type ClientValues = z.infer<typeof ClientSchema>

export function ClientForm({
  action,
  defaultValues,
  submitLabel,
  /** When true, the action redirects on success, so we don't toast here. */
  redirectsOnSuccess = false,
}: {
  action: (values: ClientValues) => Promise<{ error?: string }>
  defaultValues?: Partial<ClientValues>
  submitLabel?: string
  redirectsOnSuccess?: boolean
}) {
  const router = useRouter()
  const t = useT()
  const form = useForm<ClientValues>({
    resolver: zodResolver(ClientSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      industry: defaultValues?.industry ?? "",
      source: defaultValues?.source ?? "",
      notes: defaultValues?.notes ?? "",
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
          // On a redirecting action the navigation already happened.
          if (!redirectsOnSuccess) {
            toast.success(t("Saved", "บันทึกแล้ว"))
            router.refresh()
          }
        })}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("Name", "ชื่อ")}</FormLabel>
              <FormControl>
                <Input placeholder={t("Acme Co.", "บริษัท ตัวอย่าง จำกัด")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="industry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("Industry", "อุตสาหกรรม")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("e.g. E-commerce", "เช่น อีคอมเมิร์ซ")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="source"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("Source", "แหล่งที่มา")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("e.g. Referral", "เช่น มีคนแนะนำ")} {...field} />
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
              <FormLabel>{t("Notes", "บันทึก")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("Context, how you met, what they need…", "ที่มา รู้จักกันอย่างไร ต้องการอะไร…")}
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {submitLabel ?? t("Save client", "บันทึกลูกค้า")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={form.formState.isSubmitting}
            onClick={() => router.back()}
          >
            {t("Cancel", "ยกเลิก")}
          </Button>
        </div>
      </form>
    </Form>
  )
}
