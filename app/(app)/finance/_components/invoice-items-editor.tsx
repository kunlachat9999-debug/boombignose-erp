"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { moneyInput, invoiceLineAmount } from "@/lib/payments/input"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { useT } from "@/components/locale-provider"
import { translateMessage } from "@/lib/i18n-messages"

/** A display-ready line-item row (money already formatted by the RSC page). */
export type InvoiceItemRow = {
  id: string
  description: string
  quantity: string
  unitPrice: string
  amount: string
}

const Schema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.string().refine(v => { try { invoiceLineAmount(v, 0); return true } catch { return false } }, "Positive quantity, up to three decimals"),
  unitPriceBaht: z.string().refine(v => { try { moneyInput(v); return true } catch { return false } }, "Enter an exact THB amount"),
})

type Values = z.infer<typeof Schema>

export function InvoiceItemsEditor({
  invoiceId,
  items,
  addAction,
  deleteAction,
  locked = false,
}: {
  invoiceId: string
  items: InvoiceItemRow[]
  addAction: (input: {
    invoice_id: string
    description: string
    quantity: string
    unitPriceBaht: string
  }) => Promise<{ error?: string }>
  deleteAction: (input: { id: string }) => Promise<{ error?: string }>
  /** When true (invoice paid), render items read-only: no add row, no delete. */
  locked?: boolean
}) {
  const router = useRouter()
  const t = useT()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const form = useForm<z.input<typeof Schema>, unknown, Values>({
    resolver: zodResolver(Schema),
    defaultValues: {
      description: "",
      quantity: "1",
      unitPriceBaht: "0.00",
    },
  })

  async function onDelete(id: string) {
    setDeletingId(id)
    const res = await deleteAction({ id })
    setDeletingId(null)
    if (res?.error) {
      toast.error(translateMessage(t, res.error))
      return
    }
    toast.success(t("Line item removed", "ลบรายการแล้ว"))
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {items.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("Description", "รายละเอียด")}</TableHead>
              <TableHead className="text-right">{t("Qty", "จำนวน")}</TableHead>
              <TableHead className="text-right">{t("Unit price", "ราคาต่อหน่วย")}</TableHead>
              <TableHead className="text-right">{t("Amount", "จำนวนเงิน")}</TableHead>
              {locked ? null : <TableHead className="w-10" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.description}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {item.quantity}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {item.unitPrice}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {item.amount}
                </TableCell>
                {locked ? null : (
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={t("Delete line item", "ลบรายการ")}
                      disabled={deletingId === item.id}
                      onClick={() => onDelete(item.id)}
                    >
                      <Trash2 className="text-muted-foreground" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-muted-foreground text-sm">
          {locked
            ? t("No line items.", "ไม่มีรายการ")
            : t(
                "No line items yet. Add one below to itemize this invoice — the invoice total is then derived from the items.",
                "ยังไม่มีรายการ เพิ่มรายการด้านล่างเพื่อแจกแจงใบแจ้งหนี้ — ยอดรวมจะคำนวณจากรายการ"
              )}
        </p>
      )}

      {locked ? (
        <p className="text-muted-foreground text-sm">{t("Locked (paid)", "ถูกล็อก (ชำระแล้ว)")}</p>
      ) : (
        <Form {...form}>
        <form
          onSubmit={form.handleSubmit(async (values) => {
            const res = await addAction({ invoice_id: invoiceId, ...values })
            if (res?.error) {
              toast.error(translateMessage(t, res.error))
              return
            }
            toast.success(t("Line item added", "เพิ่มรายการแล้ว"))
            form.reset({ description: "", quantity: "1", unitPriceBaht: "0.00" })
            router.refresh()
          })}
          className="grid gap-4 sm:grid-cols-[1fr_auto_auto_auto] sm:items-start"
        >
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("Description", "รายละเอียด")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("e.g. Design work", "เช่น งานออกแบบ")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("Qty", "จำนวน")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    inputMode="decimal"
                    className="sm:w-24"
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
          <FormField
            control={form.control}
            name="unitPriceBaht"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("Unit price (฿)", "ราคาต่อหน่วย (฿)")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    inputMode="decimal"
                    className="sm:w-32"
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
          <div className="flex flex-col justify-end sm:pt-[1.625rem]">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {t("Add item", "เพิ่มรายการ")}
            </Button>
          </div>
        </form>
        </Form>
      )}
    </div>
  )
}
