import { prisma } from "@/lib/db";

const MAD_TO_EUR = 1 / 10.5;
const toEur = (amount: number, currency: string) =>
  currency === "EUR" ? amount : amount * MAD_TO_EUR;

export default async function AdminStatisticsPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);

  let visitsToday = 0;
  let visitsByHourToday: { createdAt: Date }[] = [];
  let liveVisitsRaw: { sessionId: string }[] = [];
  let visitsByPlatform: { utmSource: string | null; _count?: { id: number } }[] = [];
  let affiliateClicksByLink: { utmCampaign: string | null; _count?: { id: number } }[] = [];

  try {
    const [vToday, vByHour, vLive, vByPlatform, affClicks] = await Promise.all([
      prisma.analyticsVisit.count({ where: { createdAt: { gte: today } } }),
      prisma.analyticsVisit.findMany({
        where: { createdAt: { gte: today } },
        select: { createdAt: true },
      }),
      prisma.analyticsVisit.findMany({
        where: { createdAt: { gte: fiveMinAgo } },
        select: { sessionId: true },
      }),
      prisma.analyticsVisit.groupBy({
        by: ["utmSource"],
        where: { createdAt: { gte: today } },
        _count: { id: true },
      }),
      prisma.analyticsVisit.groupBy({
        by: ["utmCampaign"],
        where: {
          createdAt: { gte: today },
          utmSource: "affiliate",
        },
        _count: { id: true },
      }),
    ]);
    visitsToday = vToday;
    visitsByHourToday = vByHour;
    liveVisitsRaw = vLive;
    visitsByPlatform = vByPlatform;
    affiliateClicksByLink = affClicks;
  } catch {
    // AnalyticsVisit model/table may be missing; run: npx prisma generate && npx prisma db push
  }

  const [ordersToday, ordersByCountry, ordersForRevenue] = await Promise.all([
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
    prisma.order.findMany({
      where: {
        createdAt: { gte: today },
        status: { notIn: ["cancelled"] },
      },
      select: { totalAmount: true, currency: true },
    }),
  ]);

  let affiliateOrdersToday: { affiliateCode: string | null; status: string }[] = [];
  try {
    affiliateOrdersToday = await prisma.order.findMany({
      where: {
        createdAt: { gte: today },
        affiliateCode: { not: null },
      },
      select: { affiliateCode: true, status: true },
    });
  } catch {
    // Prisma client may not have affiliateCode yet; run: npx prisma generate && restart dev server
  }

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

  const bestCountries = (ordersByCountry ?? [])
    .map((g) => ({ country: g.country, orders: g._count?.id ?? 0 }))
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 10);

  const platformReach = (visitsByPlatform ?? [])
    .filter((g) => g.utmSource)
    .map((g) => ({ platform: g.utmSource!, visits: g._count?.id ?? 0 }))
    .sort((a, b) => b.visits - a.visits);

  // Affiliate tracking: link number -> { clicks, orders, conversion, statusBreakdown }
  const clicksByAffiliate: Record<string, number> = {};
  for (const g of affiliateClicksByLink ?? []) {
    const link = g.utmCampaign ?? "—";
    if (link !== "—") clicksByAffiliate[link] = g._count?.id ?? 0;
  }
  const ordersByAffiliate: Record<string, { total: number; byStatus: Record<string, number> }> = {};
  for (const o of affiliateOrdersToday ?? []) {
    const code = o.affiliateCode ?? "";
    if (!code) continue;
    if (!ordersByAffiliate[code]) ordersByAffiliate[code] = { total: 0, byStatus: {} };
    ordersByAffiliate[code].total += 1;
    const s = o.status;
    ordersByAffiliate[code].byStatus[s] = (ordersByAffiliate[code].byStatus[s] ?? 0) + 1;
  }
  const allAffiliateLinks = [...new Set([...Object.keys(clicksByAffiliate), ...Object.keys(ordersByAffiliate)])].sort();
  const affiliateMetrics = allAffiliateLinks.map((link) => {
    const clicks = clicksByAffiliate[link] ?? 0;
    const ordersData = ordersByAffiliate[link] ?? { total: 0, byStatus: {} };
    const orders = ordersData.total;
    const conversion = clicks > 0 ? (orders / clicks) * 100 : 0;
    const statusBreakdown = Object.entries(ordersData.byStatus)
      .map(([status, n]) => `${n} ${status}`)
      .join(", ") || "—";
    return {
      linkNumber: link,
      clicks,
      orders,
      conversionRate: conversion,
      statusBreakdown,
    };
  });

  const maxHourly = Math.max(1, ...visitsHourly.map((x) => x.count));

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-serif font-semibold text-black mb-8">
        Statistics
      </h1>

      {/* Visits */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-black mb-4 border-b border-[#E8E4DE] pb-2">
          Visits
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-[#E8E4DE] p-5 rounded shadow-sm">
            <p className="text-sm text-black uppercase tracking-wide">Daily visits</p>
            <p className="text-2xl font-semibold text-black mt-1">{visitsToday}</p>
            <p className="text-xs text-black mt-1">Today (since midnight)</p>
          </div>
          <div className="bg-white border border-[#E8E4DE] p-5 rounded shadow-sm">
            <p className="text-sm text-black uppercase tracking-wide">Live visits</p>
            <p className="text-2xl font-semibold text-black mt-1">{liveVisits}</p>
            <p className="text-xs text-black mt-1">Unique sessions in last 5 min</p>
          </div>
          <div className="bg-white border border-[#E8E4DE] p-5 rounded shadow-sm">
            <p className="text-sm text-black uppercase tracking-wide">Daily orders</p>
            <p className="text-2xl font-semibold text-black mt-1">{ordersToday}</p>
            <p className="text-xs text-black mt-1">Confirmed orders today</p>
          </div>
        </div>

        <div className="bg-white border border-[#E8E4DE] p-5 rounded shadow-sm">
          <p className="text-sm text-black uppercase tracking-wide mb-3">Hourly visits (today)</p>
          <div className="flex items-end gap-0.5 h-24">
            {visitsHourly.map(({ hour, count }) => (
              <div
                key={hour}
                className="flex-1 min-w-0 flex flex-col items-center group"
                title={`${hour}:00 – ${count} visits`}
              >
                <div
                  className="w-full bg-[#C9A84C] rounded-t min-h-[4px] transition-all"
                  style={{ height: `${Math.max(4, (count / maxHourly) * 80)}%` }}
                />
                <span className="text-[10px] text-black mt-1 hidden sm:block">
                  {hour}h
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Daily revenue */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-black mb-4 border-b border-[#E8E4DE] pb-2">
          Daily revenue
        </h2>
        <div className="bg-white border border-[#E8E4DE] p-6 rounded shadow-sm">
          <p className="text-3xl font-semibold text-black">€{dailyRevenueEur.toFixed(2)}</p>
          <p className="text-sm text-black mt-1">Today (EUR), excluding cancelled orders</p>
        </div>
      </section>

      {/* Affiliate tracking metrics */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-black mb-4 border-b border-[#E8E4DE] pb-2">
          Affiliate tracking metrics
        </h2>
        <p className="text-sm text-black mb-3">
          Daily performance per affiliate link. Use <code className="bg-[#F0EAE0] px-1 rounded">?utm_source=affiliate&amp;utm_campaign=LINK_NUMBER</code> for clicks. Send <code className="bg-[#F0EAE0] px-1 rounded">affiliateCode</code> when creating orders to attribute sales.
        </p>
        <div className="bg-white border border-[#E8E4DE] rounded shadow-sm overflow-hidden">
          {affiliateMetrics.length === 0 ? (
            <p className="p-5 text-black">
              No affiliate data today. Share links like <code className="bg-[#F0EAE0] px-1 rounded">yoursite.com/?utm_source=affiliate&amp;utm_campaign=AFF001</code> and pass <code className="bg-[#F0EAE0] px-1 rounded">affiliateCode: &quot;AFF001&quot;</code> in the order API to see metrics here.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F0EAE0] text-left text-black uppercase tracking-wide">
                  <th className="px-5 py-3">Affiliate link number</th>
                  <th className="px-5 py-3">Clicks (today)</th>
                  <th className="px-5 py-3">Orders (today)</th>
                  <th className="px-5 py-3">Conversion rate</th>
                  <th className="px-5 py-3">Status of the order</th>
                </tr>
              </thead>
              <tbody>
                {affiliateMetrics.map((row) => (
                  <tr key={row.linkNumber} className="border-t border-[#E8E4DE]">
                    <td className="px-5 py-3 font-medium text-black">{row.linkNumber}</td>
                    <td className="px-5 py-3 text-black">{row.clicks}</td>
                    <td className="px-5 py-3 text-black">{row.orders}</td>
                    <td className="px-5 py-3 text-black">{row.conversionRate.toFixed(1)}%</td>
                    <td className="px-5 py-3 text-black">{row.statusBreakdown}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Best countries */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-black mb-4 border-b border-[#E8E4DE] pb-2">
          Best countries (by order count)
        </h2>
        <div className="bg-white border border-[#E8E4DE] rounded shadow-sm overflow-hidden">
          {bestCountries.length === 0 ? (
            <p className="p-5 text-black">No orders yet</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F0EAE0] text-left text-black uppercase tracking-wide">
                  <th className="px-5 py-3">Country</th>
                  <th className="px-5 py-3">Orders</th>
                </tr>
              </thead>
              <tbody>
                {bestCountries.map(({ country, orders }) => (
                  <tr key={country} className="border-t border-[#E8E4DE]">
                    <td className="px-5 py-3 font-medium text-black">{country}</td>
                    <td className="px-5 py-3 text-black">{orders}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Platform reach */}
      <section>
        <h2 className="text-lg font-semibold text-black mb-4 border-b border-[#E8E4DE] pb-2">
          Platform reach (today)
        </h2>
        <p className="text-sm text-black mb-3">
          Visits where the user came from a link with <code className="bg-[#F0EAE0] px-1">utm_source</code> (e.g. facebook, tiktok, snapchat). Add tracking to your links to see data here.
        </p>
        <div className="bg-white border border-[#E8E4DE] rounded shadow-sm overflow-hidden">
          {platformReach.length === 0 ? (
            <div className="p-5 text-black text-sm space-y-3">
              <p>No platform data yet. To verify tracking works:</p>
              <ol className="list-decimal list-inside space-y-1.5 ml-1">
                <li>Open your <strong>public site</strong> (not /admin) in a new tab, e.g. <code className="bg-[#F0EAE0] px-1 rounded">https://yoursite.com/?utm_source=facebook</code> (use your dev URL if local, e.g. <code className="bg-[#F0EAE0] px-1 rounded">http://localhost:3000/?utm_source=facebook</code>).</li>
                <li>Optional: open DevTools → Network, filter by “track” or “fetch” and confirm a <code className="bg-[#F0EAE0] px-1 rounded">POST /api/v1/analytics/track</code> request with status 200.</li>
                <li>Refresh this Statistics page; “Platform reach” should show <strong>facebook</strong> with 1 visit (and “Daily visits” should increase).</li>
              </ol>
              <p className="text-black pt-1">The public site already calls the track API on every page load (see <code className="bg-[#F0EAE0] px-1 rounded">AnalyticsTracker</code> in the root layout). UTM params in the URL are sent automatically.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F0EAE0] text-left text-black uppercase tracking-wide">
                  <th className="px-5 py-3">Platform</th>
                  <th className="px-5 py-3">Visits</th>
                </tr>
              </thead>
              <tbody>
                {platformReach.map(({ platform, visits }) => (
                  <tr key={platform} className="border-t border-[#E8E4DE]">
                    <td className="px-5 py-3 font-medium text-black capitalize">{platform}</td>
                    <td className="px-5 py-3 text-black">{visits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
