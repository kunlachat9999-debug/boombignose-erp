import {
  LayoutDashboard,
  Users,
  Handshake,
  FileText,
  FolderKanban,
  Clock,
  Receipt,
  BarChart3,
  CalendarDays,
  Sparkles,
  NotebookPen,
  Workflow,
  ScrollText,
  Settings,
  Box,
  type LucideIcon,
} from "lucide-react"

export type NavItem = {
  title: string
  titleTh: string
  href: string
  icon: LucideIcon
  /** Hide from members in the sidebar (page is also role-gated server-side). */
  ownerAdminOnly?: boolean
}

/**
 * Single source of truth for the app's primary navigation and routes.
 * Every module route is registered here so the sidebar stays in sync.
 */
export const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", titleTh: "แดชบอร์ด", href: "/dashboard", icon: LayoutDashboard },
  { title: "Campus 3D", titleTh: "แคมปัส 3D", href: "/warehouse", icon: Box },
  { title: "Clients", titleTh: "ลูกค้า", href: "/clients", icon: Users },
  { title: "Deals", titleTh: "ดีล", href: "/deals", icon: Handshake },
  { title: "Quotes", titleTh: "ใบเสนอราคา", href: "/quotes", icon: FileText },
  { title: "Projects", titleTh: "โปรเจกต์", href: "/projects", icon: FolderKanban },
  { title: "Timesheets", titleTh: "บันทึกเวลา", href: "/timesheets", icon: Clock },
  { title: "Finance", titleTh: "การเงิน", href: "/finance", icon: Receipt },
  { title: "Reports", titleTh: "รายงาน", href: "/reports", icon: BarChart3 },
  { title: "Calendar", titleTh: "ปฏิทิน", href: "/calendar", icon: CalendarDays },
  { title: "Templates", titleTh: "เทมเพลต", href: "/templates", icon: Sparkles },
  { title: "Intake", titleTh: "รับงาน", href: "/intake", icon: NotebookPen },
  { title: "Automation", titleTh: "ระบบอัตโนมัติ", href: "/automation", icon: Workflow },
  { title: "Activity", titleTh: "ประวัติกิจกรรม", href: "/audit", icon: ScrollText, ownerAdminOnly: true },
  { title: "Settings", titleTh: "ตั้งค่า", href: "/settings", icon: Settings },
]
