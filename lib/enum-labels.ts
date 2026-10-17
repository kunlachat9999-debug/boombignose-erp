import type { T } from "@/lib/i18n"
import type { Enums } from "@/lib/types/database"

type Kind =
  | "activity_type"
  | "cost_category"
  | "deal_stage"
  | "invoice_status"
  | "payment_method"
  | "project_status"
  | "quote_status"
  | "recurring_interval"
  | "role_enum"
  | "subscription_status"
  | "task_status"

const ENUM_LABELS: { [K in Kind]: Record<Enums<K>, readonly [en: string, th: string]> } = {
  activity_type: {
    note: ["Note", "บันทึก"],
    call: ["Call", "โทร"],
    email: ["Email", "อีเมล"],
    meeting: ["Meeting", "ประชุม"],
    follow_up: ["Follow up", "ติดตามผล"],
  },
  cost_category: {
    software: ["Software", "ซอฟต์แวร์"],
    contractor: ["Contractor", "ผู้รับจ้าง"],
    infra: ["Infrastructure", "โครงสร้างพื้นฐาน"],
    marketing: ["Marketing", "การตลาด"],
    salary: ["Salary", "เงินเดือน"],
    other: ["Other", "อื่น ๆ"],
  },
  deal_stage: {
    lead: ["Lead", "ลูกค้าเป้าหมาย"],
    contacted: ["Contacted", "ติดต่อแล้ว"],
    discovery: ["Discovery", "สำรวจความต้องการ"],
    proposal: ["Proposal", "เสนองาน"],
    negotiation: ["Negotiation", "เจรจา"],
    won: ["Won", "ปิดได้"],
    lost: ["Lost", "ไม่สำเร็จ"],
  },
  invoice_status: {
    draft: ["Draft", "ฉบับร่าง"],
    sent: ["Sent", "ส่งแล้ว"],
    partially_paid: ["Partially paid", "ชำระบางส่วน"],
    paid: ["Paid", "ชำระแล้ว"],
    overdue: ["Overdue", "เกินกำหนด"],
    cancelled: ["Cancelled", "ยกเลิก"],
  },
  payment_method: {
    transfer: ["Bank transfer", "โอนเงิน"],
    cash: ["Cash", "เงินสด"],
    card: ["Card", "บัตร"],
    promptpay: ["PromptPay", "พร้อมเพย์"],
    cheque: ["Cheque", "เช็ค"],
    other: ["Other", "อื่น ๆ"],
  },
  project_status: {
    not_started: ["Not started", "ยังไม่เริ่ม"],
    in_progress: ["In progress", "กำลังดำเนินการ"],
    review: ["Review", "รอตรวจ"],
    delivered: ["Delivered", "ส่งมอบแล้ว"],
    support: ["Support", "ดูแลหลังส่งมอบ"],
    paused: ["Paused", "พักไว้"],
    cancelled: ["Cancelled", "ยกเลิก"],
  },
  quote_status: {
    draft: ["Draft", "ฉบับร่าง"],
    sent: ["Sent", "ส่งแล้ว"],
    accepted: ["Accepted", "อนุมัติแล้ว"],
    declined: ["Declined", "ปฏิเสธ"],
    expired: ["Expired", "หมดอายุ"],
    converted: ["Converted", "แปลงเป็นใบแจ้งหนี้แล้ว"],
  },
  recurring_interval: {
    weekly: ["Weekly", "รายสัปดาห์"],
    monthly: ["Monthly", "รายเดือน"],
    quarterly: ["Quarterly", "รายไตรมาส"],
    yearly: ["Yearly", "รายปี"],
  },
  role_enum: {
    owner: ["Owner", "เจ้าของ"],
    admin: ["Admin", "ผู้ดูแล"],
    member: ["Member", "สมาชิก"],
  },
  subscription_status: {
    active: ["Active", "ใช้งานอยู่"],
    paused: ["Paused", "พักไว้"],
    cancelled: ["Cancelled", "ยกเลิก"],
  },
  task_status: {
    todo: ["To do", "ต้องทำ"],
    in_progress: ["In progress", "กำลังดำเนินการ"],
    done: ["Done", "เสร็จแล้ว"],
  },
}

/** Display label for a database enum value; unknown values pass through. */
export function enumLabel<K extends Kind>(t: T, kind: K, value: Enums<K> | string): string {
  const pair = (ENUM_LABELS[kind] as Record<string, readonly [string, string] | undefined>)[value]
  return pair ? t(pair[0], pair[1]) : value
}
