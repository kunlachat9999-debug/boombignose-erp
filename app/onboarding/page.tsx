import { redirect } from "next/navigation"
import { getAuthenticatedUser, getOrgContext } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { signOutTo } from "./actions"
import { WorkspaceForm } from "./workspace-form"
import { getT } from "@/lib/i18n-server"

export const dynamic = "force-dynamic"

export default async function OnboardingPage() {
  const user = await getAuthenticatedUser()
  if (!user) redirect("/login?redirect=%2Fonboarding")
  if (await getOrgContext()) redirect("/dashboard")
  const t = await getT()

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("Create your workspace", "สร้างพื้นที่ทำงาน")}</CardTitle>
          <CardDescription>{t("Your account is ready. Create a workspace to begin, or open your teammate’s invitation link.", "บัญชีของคุณพร้อมแล้ว สร้างพื้นที่ทำงานเพื่อเริ่มต้น หรือเปิดลิงก์คำเชิญจากเพื่อนร่วมทีม")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground text-sm">{t("Signed in as ", "เข้าสู่ระบบในชื่อ ")}<span className="font-medium">{user.email}</span></p>
          <WorkspaceForm userId={user.id} />
          <form action={signOutTo.bind(null, "/onboarding")}>
            <Button type="submit" variant="outline" className="w-full">{t("Use another account", "ใช้บัญชีอื่น")}</Button>
          </form>
          <p className="text-muted-foreground text-sm">{t("Joining an existing team? Open its invitation link while signed in with the email address that received it.", "จะเข้าร่วมทีมที่มีอยู่แล้ว? เปิดลิงก์คำเชิญขณะเข้าสู่ระบบด้วยอีเมลที่ได้รับคำเชิญ")}</p>
        </CardContent>
      </Card>
    </div>
  )
}
