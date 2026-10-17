"use client"

import * as React from "react"
import Link from "next/link"
import { useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Tables } from "@/lib/types/database"
import { useT } from "@/components/locale-provider"
import { translateMessage } from "@/lib/i18n-messages"

type Category = Pick<Tables<"template_categories">, "id" | "name">

const NONE = "__none__"

const FormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  categoryId: z.string(),
  description: z.string(),
  internalValueBaht: z.coerce.number().min(0, "Must be 0 or more"),
  priceBaht: z.coerce.number().min(0, "Must be 0 or more"),
  reusableNotes: z.string(),
  checklist: z.array(z.object({ value: z.string() })),
  tags: z.string(),
})

type FormValues = z.infer<typeof FormSchema>

export type TemplateFormDefaults = {
  name?: string
  categoryId?: string | null
  description?: string | null
  internalValueBaht?: number | null
  priceBaht?: number | null
  reusableNotes?: string | null
  checklist?: string[]
  tags?: string[]
}

type SubmitPayload = {
  name: string
  categoryId: string | null
  description: string | null
  internalValueBaht: number | null
  priceBaht: number | null
  reusableNotes: string | null
  implementationChecklist: string[]
  tags: string[]
}

export function TemplateForm({
  categories,
  defaults,
  action,
  submitLabel,
}: {
  categories: Category[]
  defaults?: TemplateFormDefaults
  action: (payload: SubmitPayload) => Promise<{ error?: string }>
  submitLabel: string
}) {
  const t = useT()
  const form = useForm<z.input<typeof FormSchema>, unknown, FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: defaults?.name ?? "",
      categoryId: defaults?.categoryId ?? NONE,
      description: defaults?.description ?? "",
      internalValueBaht: defaults?.internalValueBaht ?? 0,
      priceBaht: defaults?.priceBaht ?? 0,
      reusableNotes: defaults?.reusableNotes ?? "",
      checklist:
        defaults?.checklist && defaults.checklist.length > 0
          ? defaults.checklist.map((value) => ({ value }))
          : [{ value: "" }],
      tags: defaults?.tags?.join(", ") ?? "",
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "checklist",
  })

  async function onSubmit(values: FormValues) {
    const payload: SubmitPayload = {
      name: values.name.trim(),
      categoryId: values.categoryId === NONE ? null : values.categoryId,
      description: values.description.trim() || null,
      internalValueBaht: values.internalValueBaht,
      priceBaht: values.priceBaht,
      reusableNotes: values.reusableNotes.trim() || null,
      implementationChecklist: values.checklist
        .map((s) => s.value.trim())
        .filter(Boolean),
      tags: values.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    }
    const res = await action(payload)
    // On success the action redirects; only an error returns here.
    if (res?.error) toast.error(translateMessage(t, res.error))
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("Name", "ชื่อ")}</FormLabel>
              <FormControl>
                <Input placeholder={t("e.g. LINE Sales-Support Bot", "เช่น บอท LINE ช่วยงานขาย")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("Category", "หมวดหมู่")}</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("No category", "ไม่มีหมวดหมู่")}>
                      {(value) =>
                        (value && value !== NONE && categories.find((c) => c.id === value)?.name) ||
                        t("No category", "ไม่มีหมวดหมู่")
                      }
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={NONE}>{t("No category", "ไม่มีหมวดหมู่")}</SelectItem>
                  {categories.map((c) => (
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("Description", "คำอธิบาย")}</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder={t("What does this automation do?", "งานอัตโนมัตินี้ทำอะไร?")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="internalValueBaht"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("Internal value (฿)", "มูลค่าภายใน (฿)")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={(field.value ?? "") as number | string}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormDescription>{t("What it saves / is worth to us.", "ช่วยประหยัดหรือมีมูลค่ากับเราเท่าไร")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="priceBaht"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("Price (฿)", "ราคาขาย (฿)")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={(field.value ?? "") as number | string}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormDescription>{t("What we charge a client.", "ราคาที่เรียกเก็บจากลูกค้า")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="reusableNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("Reusable notes", "บันทึกสำหรับใช้ซ้ำ")}</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder={t("How to reuse this across clients.", "วิธีนำไปใช้ซ้ำกับลูกค้ารายอื่น")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-3">
          <div className="space-y-1">
            <FormLabel>{t("Implementation checklist", "ขั้นตอนการติดตั้ง")}</FormLabel>
            <p className="text-muted-foreground text-sm">
              {t("The steps to ship this for a client. Add or remove rows.", "ขั้นตอนการส่งมอบให้ลูกค้า เพิ่มหรือลบแถวได้")}
            </p>
          </div>
          <div className="space-y-2">
            {fields.map((row, index) => (
              <div key={row.id} className="flex items-center gap-2">
                <Input
                  placeholder={t(`Step ${index + 1}`, `ขั้นตอนที่ ${index + 1}`)}
                  {...form.register(`checklist.${index}.value` as const)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={t("Remove step", "ลบขั้นตอน")}
                  onClick={() => (fields.length > 1 ? remove(index) : form.setValue(`checklist.${index}.value`, ""))}
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ value: "" })}
          >
            <Plus /> {t("Add step", "เพิ่มขั้นตอน")}
          </Button>
        </div>

        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("Tags", "แท็ก")}</FormLabel>
              <FormControl>
                <Input placeholder="line, bot, n8n" {...field} />
              </FormControl>
              <FormDescription>{t("Comma-separated.", "คั่นด้วยเครื่องหมายจุลภาค")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {submitLabel}
          </Button>
          <Button type="button" variant="ghost" render={<Link href="/templates" />}>
            {t("Cancel", "ยกเลิก")}
          </Button>
        </div>
      </form>
    </Form>
  )
}
