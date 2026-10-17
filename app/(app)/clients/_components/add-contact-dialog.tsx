"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { UserPlus } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { addContact } from "../actions"
import { useT } from "@/components/locale-provider"
import { translateMessage } from "@/lib/i18n-messages"

const ContactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().optional(),
  phone: z.string().optional(),
  role: z.string().optional(),
})

type ContactValues = z.infer<typeof ContactSchema>

export function AddContactDialog({ clientId }: { clientId: string }) {
  const router = useRouter()
  const t = useT()
  const [open, setOpen] = useState(false)
  const form = useForm<ContactValues>({
    resolver: zodResolver(ContactSchema),
    defaultValues: { name: "", email: "", phone: "", role: "" },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <UserPlus />
        {t("Add contact", "เพิ่มผู้ติดต่อ")}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("Add contact", "เพิ่มผู้ติดต่อ")}</DialogTitle>
          <DialogDescription>
            {t("A person at this client you talk to.", "คนที่คุณติดต่อด้วยที่ลูกค้ารายนี้")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(async (values) => {
              const res = await addContact({ client_id: clientId, ...values })
              if (res?.error) {
                toast.error(translateMessage(t, res.error))
                return
              }
              toast.success(t("Contact added", "เพิ่มผู้ติดต่อแล้ว"))
              form.reset()
              setOpen(false)
              router.refresh()
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
                    <Input placeholder={t("Jane Doe", "สมหญิง ใจดี")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Email", "อีเมล")}</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="jane@acme.co" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Phone", "โทรศัพท์")}</FormLabel>
                    <FormControl>
                      <Input placeholder="08x-xxx-xxxx" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Role", "ตำแหน่ง")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("e.g. Founder, Ops lead", "เช่น ผู้ก่อตั้ง, หัวหน้าฝ่ายปฏิบัติการ")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={form.formState.isSubmitting}
              >
                {t("Cancel", "ยกเลิก")}
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {t("Add contact", "เพิ่มผู้ติดต่อ")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
