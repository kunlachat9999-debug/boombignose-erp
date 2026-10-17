import type { Metadata } from "next"

import { requireOrgContext } from "@/lib/auth"
import { satangToBaht } from "@/lib/money"
import { getDashboardData } from "@/lib/queries/dashboard"
import { WarehouseApp } from "@/components/warehouse/warehouse-app"

export const metadata: Metadata = { title: "Campus 3D · BoomBigNose" }
export const dynamic = "force-dynamic"

export default async function WarehousePage() {
  const ctx = await requireOrgContext()
  const d = await getDashboardData()

  return (
    <WarehouseApp
      erp={{
        orgName: ctx.orgName,
        openDeals: d.openDealCount,
        pipeline: satangToBaht(d.pipelineSatang),
        revenueMonth: satangToBaht(d.monthlyRevenueSatang),
        unpaidCount: d.unpaidInvoiceCount,
        unpaid: satangToBaht(d.unpaidSatang),
        activeProjects: d.activeProjectCount,
        billableHours: d.billableHoursThisMonth,
        runwayMonths: d.runwayMonths,
      }}
    />
  )
}
