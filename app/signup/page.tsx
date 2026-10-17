"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { signUp } from "@/app/signup/actions"
import { validatePassword } from "@/lib/auth/password"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { LocaleToggle, useT } from "@/components/locale-provider"
import { translateMessage } from "@/lib/i18n-messages"
import { GoogleSignInButton } from "@/components/google-sign-in-button"

export default function SignupPage() {
  const router = useRouter()
  const t = useT()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  // Live policy check so the user sees every failing rule before submitting.
  const policy = validatePassword(password)
  const showPolicy = password.length > 0 && !policy.ok

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()

    const check = validatePassword(password)
    if (!check.ok) {
      toast.error(t("Choose a stronger password", "กรุณาตั้งรหัสผ่านที่ปลอดภัยกว่านี้"), {
        description: check.issues.map((i) => translateMessage(t, i)).join(" "),
      })
      return
    }

    setLoading(true)
    const result = await signUp({ email, password })
    setLoading(false)

    if (!result.ok) {
      toast.error(t("Sign up failed", "สมัครสมาชิกไม่สำเร็จ"), {
        description: translateMessage(t, result.error),
      })
      return
    }
    if (!result.requiresConfirmation) {
      router.push("/onboarding")
      router.refresh()
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <div className="flex min-h-svh items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="text-primary size-5" />
              <CardTitle className="text-xl">{t("Check your email", "กรุณาตรวจสอบอีเมล")}</CardTitle>
            </div>
            <CardDescription>
              {t("We sent a confirmation link to ", "เราส่งลิงก์ยืนยันไปที่ ")}
              <span className="font-medium">{email}</span>
              {t(
                ". Click it to confirm your account, then sign in.",
                " แล้ว กดลิงก์เพื่อยืนยันบัญชี จากนั้นเข้าสู่ระบบ"
              )}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              variant="outline"
              className="w-full"
              render={<Link href="/login" />}
            >
              {t("Back to sign in", "กลับไปหน้าเข้าสู่ระบบ")}
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-xl">{t("Create your account", "สร้างบัญชีของคุณ")}</CardTitle>
            <LocaleToggle />
          </div>
          <CardDescription>
            {t("Sign up for the BoomBigNose Company OS.", "สมัครใช้งาน BoomBigNose Company OS")}
          </CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("Email", "อีเมล")}</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("Password", "รหัสผ่าน")}</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={showPolicy}
                required
              />
              {showPolicy ? (
                <ul className="text-destructive space-y-1 text-xs">
                  {policy.issues.map((issue) => (
                    <li key={issue}>{translateMessage(t, issue)}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-xs">
                  {t(
                    "At least 10 characters with upper, lower, and a number.",
                    "อย่างน้อย 10 ตัวอักษร มีตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก และตัวเลข"
                  )}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="mt-2 flex-col gap-3">
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !policy.ok || email.length === 0}
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                t("Create account", "สร้างบัญชี")
              )}
            </Button>
            <div className="text-muted-foreground flex w-full items-center gap-2 text-xs">
              <span className="bg-border h-px flex-1" />
              {t("or", "หรือ")}
              <span className="bg-border h-px flex-1" />
            </div>
            <GoogleSignInButton />
            <p className="text-muted-foreground text-center text-xs">
              {t("Already have an account? ", "มีบัญชีอยู่แล้ว? ")}
              <Link href="/login" className="underline underline-offset-4">
                {t("Sign in", "เข้าสู่ระบบ")}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
