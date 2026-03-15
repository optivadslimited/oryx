import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

const MAD_TO_EUR = 1 / 10.5;
const toEur = (amount: number, currency: string) =>
  currency === "EUR" ? amount : amount * MAD_TO_EUR;

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth) {
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);

  const [
    visitsToday,
    visitsByHourToday,
    liveVisitsRaw,
    ordersToday,
    ordersByCountry,
    visitsByPlatform,
    ordersForRevenue,
  ] = await Promise.all([
    prisma.analyticsVisit.count({
      where: { createdAt: { gte: today } },
    }),
    prisma.analyticsVisit.findMany({
      where: { createdAt: { gte: today } },
      select: { createdAt: true },
    }),
    prisma.analyticsVisit.findMany({
      where: { createdAt: { gte: fiveMinAgo } },
      select: { sessionId: true },
    }),
    prisma.order.count({
      where: {
        createdAt: { gte: today },
        status: { notIn: ["cancelled"] },
      },
    }),
    prisma.order.groupBy({
      by: ["country"],
      where: { status: { notIn: ["cancelled"] } },
      _count: { id: true },
    }),
    prisma.analyticsVisit.groupBy({
      by: ["utmSource"],
      where: { createdAt: { gte: today } },
      _count: { id: true },
    }),
    prisma.order.findMany({
      where: {
        createdAt: { gte: today },
        status: { notIn: ["cancelled"] },
      },
      select: { totalAmount: true, currency: true },
    }),
  ]);

  const hourly: Record<number, number> = {};
  for (let h = 0; h < 24; h++) hourly[h] = 0;
  for (const v of visitsByHourToday) {
    const h = new Date(v.createdAt).getHours();
    hourly[h] = (hourly[h] ?? 0) + 1;
  }
  const visitsHourly = Object.entries(hourly)
    .map(([hour, count]) => ({ hour: Number(hour), count }))
    .sort((a, b) => a.hour - b.hour);

  const liveVisits = new Set(liveVisitsRaw.map((v) => v.sessionId)).size;

  const dailyRevenueEur = ordersForRevenue.reduce(
    (sum, o) => sum + toEur(Number(o.totalAmount), o.currency),
    0
  );

  const bestCountries = ordersByCountry
    .map((g) => ({ country: g.country, orders: g._count.id }))
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 10);

  const platformReach = visitsByPlatform
    .filter((g) => g.utmSource)
    .map((g) => ({ platform: g.utmSource!, visits: g._count.id }))
    .sort((a, b) => b.visits - a.visits);

  return NextResponse.json({
    dailyVisits: visitsToday,
    visitsHourly,
    liveVisits,
    dailyOrders: ordersToday,
    bestCountries,
    platformReach,
    dailyRevenueEur,
  });
}
