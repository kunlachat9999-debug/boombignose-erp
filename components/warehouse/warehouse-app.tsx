"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import {
  Bell,
  Box,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Crosshair,
  Forklift,
  House,
  Minus,
  MapPin,
  Package,
  PackageCheck,
  Plus,
  RotateCcw,
  RotateCw,
  Search,
  Truck,
  User,
  Users,
  X,
} from "lucide-react"

import { LocaleToggle, useLocale, useT } from "@/components/locale-provider"
import type { T } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { warehouseTranslator } from "./i18n"
import {
  createWarehouseScene,
  type ForkliftInfo,
  type PersonInfo,
  type Snapshot,
  type TruckInfo,
  type WarehouseScene,
  type ZoneInfo,
} from "./scene"
import type { ErpStats } from "./office"

type Entity = ForkliftInfo | TruckInfo | PersonInfo | ZoneInfo

const hhmm = (sec: number) => {
  const m = Math.floor(sec / 60) % (24 * 60)
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`
}
const card = "pointer-events-auto rounded-2xl bg-white/95 shadow-[0_8px_30px_rgba(30,58,138,0.10)] ring-1 ring-slate-900/5 backdrop-blur"

const STATE_STYLE: Record<string, string> = {
  Loading: "bg-emerald-50 text-emerald-700",
  Unloading: "bg-emerald-50 text-emerald-700",
  Arriving: "bg-amber-50 text-amber-700",
  Departing: "bg-amber-50 text-amber-700",
  "En route": "bg-blue-50 text-blue-700",
  Departed: "bg-slate-100 text-slate-500",
  Available: "bg-slate-100 text-slate-500",
}

export function WarehouseApp({ erp }: { erp?: ErpStats }) {
  const locale = useLocale()
  const t = useT()
  const w = warehouseTranslator(locale)
  const host = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<WarehouseScene | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const [snap, setSnap] = useState<Snapshot | null>(null)
  const [sel, setSel] = useState<{ id: string | null; focus: boolean; n: number }>({ id: "FL-01", focus: false, n: 0 })
  const selected = sel.id
  const [query, setQuery] = useState("")
  const [miss, setMiss] = useState(false)
  const [tab, setTab] = useState<"docks" | "forklifts" | "trucks" | "team">("docks")

  useEffect(() => {
    const s = createWarehouseScene(host.current!, {
      onSnapshot: setSnap,
      onSelect: (id) => setSel((p) => ({ id, focus: false, n: p.n + 1 })),
      reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      tr: warehouseTranslator(locale),
      erp,
    })
    sceneRef.current = s
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== searchRef.current) {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("keydown", onKey)
      s.dispose()
      sceneRef.current = null
    }
    // Rebuild the scene on language change so in-canvas labels re-render.
    // `erp` is a server snapshot per page load, so it never changes here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale])

  useEffect(() => sceneRef.current?.select(sel.id, sel.focus), [sel])
  const select = (id: string | null, focus = true) => setSel((p) => ({ id, focus, n: p.n + 1 }))

  const entities: Entity[] = snap ? [...snap.zones, ...snap.people, ...snap.forklifts, ...snap.trucks] : []
  const current = entities.find((e) => e.id === selected) ?? null

  function onSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim().toLowerCase()
    const hit = q && entities.find((x) => `${x.id} ${searchText(x)} ${w(searchText(x))}`.toLowerCase().includes(q))
    setMiss(!hit)
    if (hit) select(hit.id)
  }

  const trucks = snap?.trucks ?? []
  const onSite = trucks.filter((t) => t.state !== "En route" && t.state !== "Departed")
  const inbound = trucks.filter((t) => t.state === "En route")

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#e7ebf7] text-slate-900">
      {/* isolate: CSS2D label z-indexes must not climb over the HUD */}
      <div ref={host} className="absolute inset-0 isolate" />

      {/* header */}
      <header className="absolute inset-x-0 top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200/70 bg-white/90 px-4 backdrop-blur md:gap-6 md:px-6">
        <Link href="/dashboard" className="flex items-center gap-2" title={t("Back to ERP", "กลับไปหน้า ERP")}>
          <Box className="size-7 fill-blue-500 text-blue-700" aria-hidden />
          <span className="text-lg font-bold tracking-tight">BoomBigNose</span>
          <span className="hidden rounded-md bg-blue-50 px-1.5 py-0.5 text-[11px] font-semibold text-blue-700 sm:inline">{t("Campus", "แคมปัส")}</span>
        </Link>
        <form onSubmit={onSearch} className="relative hidden max-w-md flex-1 md:block">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setMiss(false)
            }}
            placeholder={t("Search people, rooms, forklifts, trucks… (Enter)", "ค้นหาคน ห้อง รถยก รถบรรทุก… (Enter)")}
            aria-label={t("Search people, rooms, forklifts and trucks", "ค้นหาคน ห้อง รถยก และรถบรรทุก")}
            className={cn(
              "h-10 w-full rounded-xl border bg-white pr-10 pl-9 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100",
              miss ? "border-rose-300" : "border-slate-200",
            )}
          />
          <kbd className="absolute top-1/2 right-3 -translate-y-1/2 rounded border border-slate-200 px-1.5 text-[11px] text-slate-400">/</kbd>
        </form>
        <div className="ml-auto flex items-center gap-2 md:gap-3">
          <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white py-1.5 pr-3 pl-1.5 lg:flex">
            <span className="rounded-lg bg-blue-600 px-2 py-1 text-xs font-bold text-white">WH-01</span>
            <div className="leading-tight">
              <div className="text-sm font-semibold">Bangna Hub</div>
              <div className="text-[11px] text-slate-500">
                {t(`78% full · ${onSite.length}/2 docked`, `เต็ม 78% · จอด ${onSite.length}/2`)}
              </div>
            </div>
            <ChevronDown className="size-4 text-slate-400" aria-hidden />
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            {t("Live", "สด")} <span className="tabular-nums">{snap ? hhmm(snap.sim) : "09:40"}</span>
          </div>
          <LocaleToggle className="text-slate-600" />
          <button type="button" aria-label={t("Notifications", "การแจ้งเตือน")} className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100">
            <Bell className="size-5" />
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-rose-500" />
          </button>
          <div className="hidden items-center gap-2 border-l border-slate-200 pl-3 sm:flex">
            <div className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-semibold text-white">BB</div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">{t("Ops Control", "ศูนย์ควบคุม")}</div>
              <div className="text-[11px] text-slate-500">{erp?.orgName ?? "BoomBigNose"}</div>
            </div>
          </div>
        </div>
      </header>

      {/* KPIs */}
      <div className="pointer-events-none absolute top-20 left-4 z-10 flex gap-3 md:left-6">
        <Kpi icon={<Package className="size-5" />} label={t("Stock on hand", "สินค้าคงคลัง")} value={(snap?.stock ?? 1412).toLocaleString()} delta={snap?.stockDelta} sub={t("pallets · WH-01", "พาเลท · WH-01")} />
        <Kpi
          icon={<Truck className="size-5" />}
          label={t("Trucks on site", "รถบรรทุกในพื้นที่")}
          value={String(onSite.length)}
          sub={t(`${inbound.length} inbound · WH-01`, `กำลังเข้า ${inbound.length} · WH-01`)}
          className="hidden sm:flex"
        />
        <Kpi icon={<Clock className="size-5" />} label={t("On-time delivery", "ส่งตรงเวลา")} value="96.6%" delta={0.4} unit="%" sub={t("last 30 days · WH-01", "30 วันล่าสุด · WH-01")} className="hidden lg:flex" />
        <Kpi
          icon={<Users className="size-5" />}
          label={t("Team at desks", "ทีมที่อยู่ที่โต๊ะ")}
          value={snap ? `${snap.people.filter((p) => /^(At desk|On a call)$/.test(p.status)).length}/${snap.people.length}` : "–"}
          sub={w(snap?.zones.find((z) => z.id === "meeting")?.status ?? "") || t("HQ office", "สำนักงานใหญ่")}
          className="hidden xl:flex"
        />
      </div>

      {/* zone quick-nav */}
      {snap && (
        <nav aria-label={t("Campus zones", "โซนในแคมปัส")} className="pointer-events-none absolute top-[10.5rem] left-4 z-10 hidden max-w-[calc(100%-30rem)] flex-wrap gap-1.5 md:flex md:left-6">
          {snap.zones.map((z) => (
            <button
              key={z.id}
              type="button"
              onClick={() => select(z.id)}
              className={cn(
                "pointer-events-auto flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm ring-1 backdrop-blur",
                selected === z.id ? "bg-blue-600 text-white ring-blue-600" : "bg-white/90 text-slate-700 ring-slate-900/5 hover:bg-white",
              )}
            >
              <MapPin className="size-3.5" aria-hidden />
              {w(z.name)}
            </button>
          ))}
          <button
            type="button"
            onClick={() => select("FL-01")}
            className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-900/5 hover:bg-white"
          >
            <Forklift className="size-3.5" aria-hidden />
            {t("Warehouse yard", "ลานคลังสินค้า")}
          </button>
        </nav>
      )}

      {/* camera controls */}
      <div className={cn(card, "absolute top-20 right-4 z-10 flex flex-col p-1 md:right-[25rem]")}>
        <CtrlBtn label={t("Zoom in", "ซูมเข้า")} onClick={() => sceneRef.current?.zoom(0.75)}><Plus /></CtrlBtn>
        <CtrlBtn label={t("Zoom out", "ซูมออก")} onClick={() => sceneRef.current?.zoom(1.33)}><Minus /></CtrlBtn>
        <div className="mx-2 my-1 h-px bg-slate-200" />
        <CtrlBtn label={t("Rotate left", "หมุนซ้าย")} onClick={() => sceneRef.current?.rotate(-1)}><RotateCcw /></CtrlBtn>
        <CtrlBtn label={t("Rotate right", "หมุนขวา")} onClick={() => sceneRef.current?.rotate(1)}><RotateCw /></CtrlBtn>
        <CtrlBtn label={t("Reset view", "รีเซ็ตมุมมอง")} onClick={() => sceneRef.current?.home()}><House /></CtrlBtn>
      </div>

      {/* detail panel */}
      {current && (
        <aside className={cn(card, "absolute top-20 right-4 z-10 hidden w-[23rem] p-4 md:block")} aria-label={t(`${current.id} details`, `รายละเอียด ${current.id}`)}>
          <div className="flex items-start gap-3">
            <div className="grid size-12 place-items-center rounded-xl bg-slate-50 text-blue-600 ring-1 ring-slate-200">
              {{ forklift: <Forklift className="size-6" />, truck: <Truck className="size-6" />, person: <User className="size-6" />, zone: <MapPin className="size-6" /> }[current.kind]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold tracking-wide text-blue-600 uppercase">
                {current.kind === "person"
                  ? `${t("Team", "ทีม")} · ${w(current.zone)}`
                  : current.kind === "zone"
                    ? t("Zone · HQ office", "โซน · สำนักงานใหญ่")
                    : `${current.kind === "truck" ? t("truck", "รถบรรทุก") : t("forklift", "รถยก")} · WH-01`}
              </div>
              <div className="text-lg leading-tight font-bold">{current.kind === "zone" ? w(current.name) : current.id}</div>
              <div className="truncate text-xs text-slate-500">{subtitle(current, w)}</div>
            </div>
            <CtrlBtn label={t("Follow on map", "ติดตามบนแผนที่")} onClick={() => select(current.id)}><Crosshair /></CtrlBtn>
            <CtrlBtn label={t("Close details", "ปิดรายละเอียด")} onClick={() => select(null, false)}><X /></CtrlBtn>
          </div>
          <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
            <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
              {w(current.kind === "truck" ? current.state : current.status)}
            </span>
            <span className="truncate text-xs text-slate-500">{caption(current, t, w)}</span>
          </div>
          {current.kind === "zone" ? (
            <>
              <dl className="mt-2 text-sm">
                {current.stats.map(([k, v]) => (
                  <Row key={k} k={w(k)} v={w(v)} />
                ))}
              </dl>
              <div className="mt-3 flex gap-2">
                {current.links.map(([label, href]) => (
                  <Link key={href} href={href} className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-blue-700">
                    {t(`Open ${label} →`, `เปิด${w(label)} →`)}
                  </Link>
                ))}
              </div>
            </>
          ) : current.kind === "person" ? (
            <dl className="mt-2 text-sm">
              <Row k={t("Role", "ตำแหน่ง")} v={w(current.role)} />
              <Row k={t("Zone", "โซน")} v={w(current.zone)} />
              <Row k={t("Activity", "กิจกรรม")} v={w(current.status)} />
              <Row k={t("Tasks done today", "งานที่เสร็จวันนี้")} v={current.tasks} />
              <Row k={t("Site", "สถานที่")} v="BoomBigNose HQ" />
            </dl>
          ) : current.kind === "forklift" ? (
            <>
              <Meter value={current.battery} label={t(`Battery ${current.battery}%`, `แบตเตอรี่ ${current.battery}%`)} />
              <dl className="mt-2 text-sm">
                <Row k={t("Carrying", "บรรทุก")} v={w(current.carrying)} />
                <Row k={t("Moves today", "เที่ยววันนี้")} v={current.moves} />
                <Row k={t("Speed", "ความเร็ว")} v={t(`${current.speedKmh.toFixed(1)} km/h`, `${current.speedKmh.toFixed(1)} กม./ชม.`)} />
                <Row k={t("Charger", "แท่นชาร์จ")} v={<span className="text-blue-600">{current.charger}</span>} />
                <Row k={t("Site", "สถานที่")} v="Bangna Hub" />
              </dl>
            </>
          ) : (
            <>
              <Meter value={(current.loaded / current.capacity) * 100} label={t(`${current.loaded}/${current.capacity} pallets`, `${current.loaded}/${current.capacity} พาเลท`)} />
              <dl className="mt-2 text-sm">
                <Row k={t("Carrier", "บริษัทขนส่ง")} v={current.carrier} />
                <Row k={t("Direction", "ทิศทาง")} v={current.direction === "outbound" ? t("Outbound", "ขาออก") : t("Inbound", "ขาเข้า")} />
                <Row k={t("Dock", "ช่องจอด")} v={w(current.bay)} />
                <Row k={t("ETA", "เวลาถึงโดยประมาณ")} v={current.eta != null ? t(`${Math.ceil(current.eta / 60)} min`, `${Math.ceil(current.eta / 60)} นาที`) : t("On site", "อยู่ในพื้นที่")} />
                <Row k={t("Site", "สถานที่")} v="Bangna Hub" />
              </dl>
            </>
          )}
        </aside>
      )}

      {/* bottom: shipment tracking + docks */}
      {snap && (
        <div className="pointer-events-none absolute inset-x-4 bottom-4 z-10 hidden items-end gap-4 md:inset-x-6 md:flex">
          <Shipment snap={snap} onOpen={() => select(snap.shipment.truckId)} />
          <section className={cn(card, "ml-auto w-[30rem] p-3")} aria-label={t("Yard board", "กระดานลานจอด")}>
            <div className="flex items-center gap-1 rounded-xl bg-slate-50 p-1" role="tablist">
              {(
                [
                  ["docks", t("Docks", "ช่องจอด"), `${onSite.length}/2`],
                  ["forklifts", t("Forklifts", "รถยก"), `${snap.forklifts.filter((f) => f.speedKmh > 0.5).length}/2`],
                  ["trucks", t("Trucks", "รถบรรทุก"), String(trucks.length)],
                  ["team", t("Team", "ทีม"), String(snap.people.length)],
                ] as const
              ).map(([k, label, n]) => (
                <button
                  key={k}
                  role="tab"
                  aria-selected={tab === k}
                  onClick={() => setTab(k)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-semibold",
                    tab === k ? "bg-white shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-800",
                  )}
                >
                  {label} <span className="font-medium text-slate-400">{n}</span>
                </button>
              ))}
            </div>
            <ul className="mt-1 max-h-48 divide-y divide-slate-100 overflow-y-auto text-sm">
              {tab === "docks" &&
                (["Bay 1", "Bay 2"] as const).map((bay) => {
                  const tk = onSite.find((x) => x.bay === bay)
                  return tk ? (
                    <BoardRow key={bay} title={w(bay)} sub="WH-01" name={`${tk.id} · ${tk.carrier}`} state={tk.state} right={`${tk.loaded}/${tk.capacity}`} progress={tk.loaded / tk.capacity} onClick={() => select(tk.id)} />
                  ) : (
                    <BoardRow key={bay} title={w(bay)} sub="WH-01" name={t("No truck assigned", "ยังไม่มีรถจอด")} state="Available" />
                  )
                })}
              {tab === "docks" &&
                inbound.map((tk) => (
                  <BoardRow key={tk.id} title={t("Inbound", "ขาเข้า")} sub="WH-01" name={`${tk.id} · ${tk.carrier}`} state="En route" right={t(`${Math.max(1, Math.ceil((tk.eta ?? 0) / 60))} min`, `${Math.max(1, Math.ceil((tk.eta ?? 0) / 60))} นาที`)} />
                ))}
              {tab === "forklifts" &&
                snap.forklifts.map((f) => (
                  <BoardRow key={f.id} title={f.id} sub={f.charger} name={w(f.status)} state={f.speedKmh > 0.5 ? "Loading" : "Available"} stateLabel={f.speedKmh > 0.5 ? t("Moving", "กำลังวิ่ง") : t("Stopped", "จอดอยู่")} right={`${f.battery}%`} onClick={() => select(f.id)} />
                ))}
              {tab === "team" &&
                snap.people.map((p) => (
                  <BoardRow
                    key={p.id}
                    title={p.name}
                    sub={w(p.zone)}
                    name={w(p.status)}
                    state={/^(At desk|On a call)$/.test(p.status) ? "Loading" : p.status.startsWith("In meeting") ? "En route" : "Arriving"}
                    stateLabel={/^(At desk|On a call)$/.test(p.status) ? t("At desk", "อยู่ที่โต๊ะ") : p.status.startsWith("In meeting") ? t("Meeting", "ประชุม") : t("Away", "ไม่อยู่")}
                    right={t(`${p.tasks} tasks`, `${p.tasks} งาน`)}
                    onClick={() => select(p.id)}
                  />
                ))}
              {tab === "trucks" &&
                trucks.map((tk) => (
                  <BoardRow key={tk.id} title={tk.id} sub={tk.direction === "outbound" ? t("outbound", "ขาออก") : t("inbound", "ขาเข้า")} name={tk.carrier} state={tk.state} right={w(tk.bay)} onClick={tk.state === "En route" || tk.state === "Departed" ? undefined : () => select(tk.id)} />
                ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  )
}

function searchText(e: Entity) {
  if (e.kind === "truck") return e.carrier
  if (e.kind === "forklift") return e.operator
  if (e.kind === "person") return `${e.name} ${e.role} ${e.zone}`
  return `${e.name} ${e.sub}`
}

function subtitle(e: Entity, w: (s: string) => string) {
  if (e.kind === "forklift") return `${e.operator} · ${e.model}`
  if (e.kind === "truck") return `${e.carrier} · ${w(e.bay)}`
  if (e.kind === "person") return w(e.role)
  return w(e.sub)
}

function caption(e: Entity, t: T, w: (s: string) => string) {
  if (e.kind === "forklift") return e.carrying === "Empty" ? t("Forks empty", "งาไม่มีของ") : t(`Carrying ${e.carrying}`, `กำลังยก ${e.carrying}`)
  if (e.kind === "truck")
    return e.direction === "outbound"
      ? t(`Outbound · ${e.loaded}/${e.capacity} loaded`, `ขาออก · ขึ้นแล้ว ${e.loaded}/${e.capacity}`)
      : t(`Inbound · ${e.loaded}/${e.capacity} pallets aboard`, `ขาเข้า · มี ${e.loaded}/${e.capacity} พาเลท`)
  if (e.kind === "person") return w(e.zone)
  return t("Live · simulated", "สด · จำลอง")
}

function Kpi({ icon, label, value, sub, delta, unit = "", className }: { icon: React.ReactNode; label: string; value: string; sub: string; delta?: number; unit?: string; className?: string }) {
  return (
    <div className={cn(card, "flex w-56 items-center gap-3 px-4 py-3", className)}>
      <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">{icon}</div>
      <div className="min-w-0">
        <div className="text-xs font-medium text-slate-600">{label}</div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tabular-nums">{value}</span>
          {delta != null && delta !== 0 && (
            <span className={cn("text-xs font-semibold tabular-nums", delta > 0 ? "text-emerald-600" : "text-rose-600")}>
              {delta > 0 ? "↑" : "↓"} {delta > 0 ? "+" : ""}
              {delta}
              {unit}
            </span>
          )}
        </div>
        <div className="truncate text-[11px] text-slate-500">{sub}</div>
      </div>
    </div>
  )
}

function CtrlBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid size-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none [&>svg]:size-4"
    >
      {children}
    </button>
  )
}

function Meter({ value, label }: { value: number; label: string }) {
  return (
    <div className="mt-3 flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-emerald-500 transition-[width] duration-500" style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      <span className="text-xs text-slate-500 tabular-nums">{label}</span>
    </div>
  )
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between border-b border-slate-100 py-2 last:border-0">
      <dt className="text-slate-500">{k}</dt>
      <dd className="truncate pl-4 font-medium tabular-nums">{v}</dd>
    </div>
  )
}

function BoardRow(p: { title: string; sub: string; name: string; state: string; stateLabel?: string; right?: string; progress?: number; onClick?: () => void }) {
  const w = warehouseTranslator(useLocale())
  const body = (
    <>
      <div className="w-16 shrink-0 leading-tight">
        <div className="font-semibold">{p.title}</div>
        <div className="text-[11px] text-slate-400 capitalize">{p.sub}</div>
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-2 truncate">
        {p.state !== "Available" && <span className="size-1.5 shrink-0 rounded-full bg-blue-600" />}
        <span className={cn("truncate", p.state === "Available" && "text-slate-500")}>{p.name}</span>
      </div>
      <span className={cn("w-24 shrink-0 rounded-md px-2 py-1 text-center text-xs font-semibold", STATE_STYLE[p.state] ?? STATE_STYLE.Available)}>{p.stateLabel ?? w(p.state)}</span>
      <div className="w-14 shrink-0 text-right text-xs text-slate-500 tabular-nums">
        {p.progress != null && (
          <div className="mb-1 h-1 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full bg-emerald-500" style={{ width: `${p.progress * 100}%` }} />
          </div>
        )}
        {p.right}
      </div>
      <ChevronRight className={cn("size-4 shrink-0", p.onClick ? "text-slate-400" : "text-transparent")} aria-hidden />
    </>
  )
  return (
    <li>
      {p.onClick ? (
        <button type="button" onClick={p.onClick} className="flex w-full items-center gap-3 rounded-lg px-1 py-2 text-left hover:bg-slate-50">
          {body}
        </button>
      ) : (
        <div className="flex items-center gap-3 px-1 py-2">{body}</div>
      )}
    </li>
  )
}

function Shipment({ snap, onOpen }: { snap: Snapshot; onOpen: () => void }) {
  const t = useT()
  const s = snap.shipment
  const transitEta = s.loadEta + 8 * 60
  const steps = [
    { icon: ClipboardCheck, label: t("Order Confirmed", "ยืนยันคำสั่งซื้อ"), time: hhmm(s.confirmedAt) },
    { icon: Package, label: t("Picked", "หยิบสินค้าแล้ว"), time: hhmm(s.pickedAt) },
    { icon: PackageCheck, label: t(`Loading ${s.loaded}/${s.capacity}`, `ขึ้นของ ${s.loaded}/${s.capacity}`), time: `ETA ${hhmm(s.loadEta)}` },
    { icon: Truck, label: t("In Transit", "ระหว่างขนส่ง"), time: `ETA ${hhmm(transitEta)}` },
    { icon: Check, label: t("Delivered", "ส่งถึงแล้ว"), time: `ETA ${hhmm(transitEta + 32 * 60)}` },
  ]
  const minsLeft = Math.max(0, Math.round((s.loadEta - snap.sim) / 60))
  return (
    <section className={cn(card, "flex min-w-0 flex-1 items-center gap-4 p-4")} aria-label={t("Shipment tracking", "ติดตามการขนส่ง")}>
      <div className="min-w-0 flex-1">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-semibold">
            <Truck className="size-4 text-blue-600" aria-hidden /> {t("Shipment Tracking", "ติดตามการขนส่ง")}
          </h2>
          <span className="text-xs text-slate-500">{s.truckId} · BoomBigNose Logistics</span>
        </div>
        <ol className="flex items-start">
          {steps.map((st, i) => {
            const done = i < s.step
            const active = i === s.step
            return (
              <li key={st.label} className="relative flex flex-1 flex-col items-center text-center">
                {i > 0 && <span className={cn("absolute top-4 right-1/2 h-0.5 w-full -translate-y-1/2", i <= s.step ? "bg-blue-600" : "bg-slate-200")} />}
                <span
                  className={cn(
                    "relative grid size-8 place-items-center rounded-full",
                    done && "bg-blue-600 text-white",
                    active && "bg-blue-600 text-white ring-4 ring-blue-100",
                    !done && !active && "bg-slate-100 text-slate-400",
                  )}
                >
                  <st.icon className="size-4" aria-hidden />
                </span>
                <span className={cn("mt-1.5 text-xs font-medium whitespace-nowrap", !done && !active && "text-slate-500")}>{st.label}</span>
                <span className="text-[11px] text-slate-400 tabular-nums">{st.time}</span>
              </li>
            )
          })}
        </ol>
      </div>
      <button type="button" onClick={onOpen} className="hidden w-64 shrink-0 items-center gap-3 rounded-xl bg-slate-50 p-3 text-left ring-1 ring-slate-200 hover:bg-slate-100 xl:flex">
        <Truck className="size-10 shrink-0 text-blue-600" aria-hidden />
        <div className="min-w-0 flex-1 leading-tight">
          <div className="font-bold">{s.no}</div>
          <div className="truncate text-xs text-slate-500">{t("To: ", "ปลายทาง: ")}{s.to}</div>
          <span className="mt-1 inline-block rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
            {s.step === 2 ? t("Loading", "กำลังขึ้นของ") : t("In Transit", "ระหว่างขนส่ง")}
          </span>
          <div className="mt-1 text-[11px] text-slate-500">WH-01 · {t("Bay 1", "ช่อง 1")} · {s.step === 2 ? t(`${minsLeft} min left`, `เหลือ ${minsLeft} นาที`) : t("departed", "ออกแล้ว")}</div>
        </div>
        <ChevronRight className="size-4 text-slate-400" aria-hidden />
      </button>
    </section>
  )
}
