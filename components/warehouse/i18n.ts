/**
 * Display-only Thai for strings the 3D simulation generates. The simulation
 * keeps English internally (it compares states like "Loading" / "At desk"), so
 * translation happens only where text reaches the screen.
 */
const TH: Record<string, string> = {
  // zones
  "Sales floor": "โซนฝ่ายขาย",
  "Clients & Deals": "ลูกค้าและดีล",
  "Project studio": "สตูดิโอโปรเจกต์",
  "Projects & Timesheets": "โปรเจกต์และบันทึกเวลา",
  Reception: "แผนกต้อนรับ",
  "Client intake": "รับงานลูกค้า",
  "Server room": "ห้องเซิร์ฟเวอร์",
  Automations: "ระบบอัตโนมัติ",
  "Meeting room": "ห้องประชุม",
  Calendar: "ปฏิทิน",
  "Founder office": "ห้องผู้ก่อตั้ง",
  "Dashboard & Reports": "แดชบอร์ดและรายงาน",
  Finance: "การเงิน",
  "Invoices & Quotes": "ใบแจ้งหนี้และใบเสนอราคา",
  // zone links
  Deals: "ดีล",
  Clients: "ลูกค้า",
  Projects: "โปรเจกต์",
  Timesheets: "บันทึกเวลา",
  Intake: "รับงาน",
  Automation: "ระบบอัตโนมัติ",
  Dashboard: "แดชบอร์ด",
  Reports: "รายงาน",
  Quotes: "ใบเสนอราคา",
  // roles
  "Account Executive": "พนักงานดูแลลูกค้า",
  "Sales Lead": "หัวหน้าฝ่ายขาย",
  "BD Manager": "ผู้จัดการพัฒนาธุรกิจ",
  "Customer Success": "ฝ่ายดูแลลูกค้า",
  "Sales Development": "ฝ่ายพัฒนายอดขาย",
  "Project Lead": "หัวหน้าโปรเจกต์",
  Designer: "นักออกแบบ",
  Developer: "นักพัฒนา",
  "Project Manager": "ผู้จัดการโปรเจกต์",
  "Finance Lead": "หัวหน้าฝ่ายการเงิน",
  Accountant: "นักบัญชี",
  CEO: "ซีอีโอ",
  Receptionist: "พนักงานต้อนรับ",
  // people activity
  "At desk": "อยู่ที่โต๊ะ",
  "On a call": "กำลังคุยโทรศัพท์",
  "Getting coffee": "กำลังชงกาแฟ",
  "Water break": "พักดื่มน้ำ",
  "At the printer": "อยู่ที่เครื่องพิมพ์",
  "Checking servers": "กำลังตรวจเซิร์ฟเวอร์",
  "At reception": "อยู่ที่แผนกต้อนรับ",
  "Briefing the founder": "กำลังรายงานผู้ก่อตั้ง",
  "Syncing with finance": "กำลังประสานงานฝ่ายการเงิน",
  "coffee bar": "มุมกาแฟ",
  "water cooler": "ตู้น้ำ",
  printer: "เครื่องพิมพ์",
  "server room": "ห้องเซิร์ฟเวอร์",
  reception: "แผนกต้อนรับ",
  "founder office": "ห้องผู้ก่อตั้ง",
  finance: "ฝ่ายการเงิน",
  "meeting room": "ห้องประชุม",
  desk: "โต๊ะทำงาน",
  // meetings
  "Sprint review": "ทบทวนสปรินต์",
  "Pipeline sync": "อัปเดตยอดขาย",
  "Client kickoff": "เริ่มงานลูกค้า",
  "Design crit": "รีวิวงานออกแบบ",
  "Weekly standup": "ประชุมประจำสัปดาห์",
  // zone stats
  "Open deals": "ดีลที่เปิดอยู่",
  Pipeline: "ยอดขายที่รอปิด",
  "Calls today": "การโทรวันนี้",
  "Team at desks": "ทีมที่อยู่ที่โต๊ะ",
  "Active projects": "โปรเจกต์ที่ดำเนินอยู่",
  "Tasks done today": "งานที่เสร็จวันนี้",
  "Hours logged": "ชั่วโมงที่บันทึก",
  "Visitors today": "ผู้มาติดต่อวันนี้",
  "New intake leads": "ลูกค้าใหม่ที่รับเข้า",
  "Automations run": "ระบบอัตโนมัติที่ทำงาน",
  Webhooks: "เว็บฮุก",
  Healthy: "ปกติ",
  Uptime: "เวลาทำงาน",
  "Last cron": "รอบล่าสุด",
  Now: "ตอนนี้",
  Seated: "นั่งอยู่",
  "Meetings today": "ประชุมวันนี้",
  Next: "ถัดไป",
  "After this one": "หลังจบประชุมนี้",
  "Revenue MTD": "รายได้เดือนนี้",
  "Cash runway": "ระยะเวลาเงินสำรอง",
  "14 mo": "14 เดือน",
  Founder: "ผู้ก่อตั้ง",
  "Invoices due": "ใบแจ้งหนี้ครบกำหนด",
  "Paid today": "ชำระวันนี้",
  Free: "ว่าง",
  "In use": "ใช้งานอยู่",
  Available: "ว่าง",
  "All systems normal": "ทุกระบบปกติ",
  OK: "ปกติ",
  // yard
  "Bay 1": "ช่อง 1",
  "Bay 2": "ช่อง 2",
  "En route": "กำลังมา",
  Arriving: "กำลังเข้าจอด",
  Loading: "กำลังขึ้นของ",
  Unloading: "กำลังลงของ",
  Departing: "กำลังออก",
  Departed: "ออกไปแล้ว",
  Empty: "ว่าง",
  Idle: "ว่าง",
  "Loading truck": "กำลังขึ้นของรถ",
  "Picking pallet": "กำลังยกพาเลท",
  "Returning to staging": "กำลังกลับจุดพัก",
  "Scanning Rack A": "กำลังสแกนชั้น A",
  "Cycle count · Rack A": "นับสต็อก · ชั้น A",
  "Waiting for truck": "รอรถบรรทุก",
  "Event kits": "ชุดอุปกรณ์งานอีเวนต์",
  Entrance: "ทางเข้า",
  "Billable hours this month": "ชั่วโมงเรียกเก็บได้เดือนนี้",
  "Unpaid invoices": "ใบแจ้งหนี้ค้างชำระ",
  Unpaid: "ยอดค้างชำระ",
  "New intake lead": "มีลูกค้าใหม่เข้ามา",
}

/** Prefix patterns: the English prefix is replaced and the rest is translated too. */
const PREFIXES: [string, string][] = [
  ["Walking to ", "กำลังเดินไป"],
  ["In meeting · ", "ประชุมอยู่ · "],
  ["In use · ", "ใช้งานอยู่ · "],
  ["New deal · ", "ดีลใหม่ · "],
  ["Deal won · ", "ปิดดีลได้ · "],
  ["Invoice paid · ", "ชำระใบแจ้งหนี้แล้ว · "],
]

export function warehouseTranslator(locale: "th" | "en"): (s: string) => string {
  if (locale === "en") return (s) => s
  const tr = (s: string): string => {
    if (TH[s]) return TH[s]
    for (const [en, th] of PREFIXES) if (s.startsWith(en)) return th + tr(s.slice(en.length))
    const months = /^([\d.]+) mo$/.exec(s)
    if (months) return `${months[1]} เดือน`
    const desks = /^(\d+\/\d+) at desks$/.exec(s)
    if (desks) return `อยู่ที่โต๊ะ ${desks[1]}`
    return s
  }
  return tr
}
