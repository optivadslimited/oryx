import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function AdminDashboardPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    ordersToday,
    ordersTodayList,
    totalProducts,
    lowStockCount,
    recentOrders,
  ] = await Promise.all([
    prisma.order.count({
      where: { createdAt: { gte: today }, status: { notIn: ["cancelled"] } },
    }),
    prisma.order.findMany({
      where: {
        createdAt: { gte: today },
        status: { notIn: ["cancelled"] },
      },
      select: { totalAmount: true, currency: true },
    }),
    prisma.product.count({ where: { status: "active" } }),
    prisma.productVariant.count({
      where: {
        stockQuantity: { lte: 5 },
        product: { status: "active" },
      },
    }),
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { items: true },
    }),
  ]);

  const MAD_TO_EUR = 1 / 10.5;
  const toEur = (amount: number, currency: string) =>
    currency === "EUR" ? amount : amount * MAD_TO_EUR;
  const revenueTodayEur = ordersTodayList.reduce(
    (sum, o) => sum + toEur(Number(o.totalAmount), o.currency),
    0
  );

  const stats = [
    { label: "Orders today", value: ordersToday, href: "/admin/orders" },
    {
      label: "Revenue (EUR)",
      value: `€${revenueTodayEur.toFixed(0)}`,
      href: "/admin/orders",
    },
    { label: "Active products", value: totalProducts, href: "/admin/products" },
    {
      label: "Low stock alerts",
      value: lowStockCount,
      href: lowStockCount > 0 ? "/admin/products?low_stock=1" : "/admin/products",
    },
  ];

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-black",
    confirmed: "bg-blue-100 text-black",
    processing: "bg-indigo-100 text-black",
    shipped: "bg-purple-100 text-black",
    delivered: "bg-green-100 text-black",
    returned: "bg-orange-100 text-black",
    cancelled: "bg-gray-100 text-black",
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-serif font-semibold text-black mb-8">
        Dashboard
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map(({ label, value, href }) => (
          <Link
            key={label}
            href={href}
            className="bg-white border border-[#E8E4DE] p-5 rounded shadow-sm hover:shadow transition-shadow"
          >
            <p className="text-sm text-black uppercase tracking-wide">{label}</p>
            <p className="text-xl font-semibold text-black mt-1">{value}</p>
          </Link>
        ))}
      </div>

      <div className="flex gap-4 mb-6">
        <Link
          href="/admin/products/new"
          className="inline-block px-4 py-2 bg-[#1B2A4A] text-white text-sm font-medium uppercase tracking-wide hover:bg-[#C9A84C] hover:text-black"
        >
          + Add product
        </Link>
        <Link
          href="/admin/orders"
          className="inline-block px-4 py-2 border border-[#1B2A4A] text-black text-sm font-medium uppercase tracking-wide hover:bg-[#1B2A4A] hover:text-white"
        >
          View all orders
        </Link>
      </div>

      <div className="bg-white border border-[#E8E4DE] rounded shadow-sm overflow-hidden">
        <h2 className="px-5 py-4 border-b border-[#E8E4DE] font-semibold text-black">
          Recent orders
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F0EAE0] text-left text-black uppercase tracking-wide">
                <th className="px-5 py-3">Order</th>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Full Name</th>
                <th className="px-5 py-3">Address</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Total Rev</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-black">
                    No orders yet
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => {
                  const productNames = [...new Set(order.items.map((i) => i.productName))].join(" & ") || "—";
                  return (
                  <tr key={order.id} className="border-t border-[#E8E4DE] hover:bg-[#FAF8F4]">
                    <td className="px-5 py-3 font-mono text-black">
                      {order.orderNumber}
                    </td>
                    <td className="px-5 py-3 text-black text-xs max-w-[180px]" title={productNames}>
                      <span className="line-clamp-2">{productNames}</span>
                    </td>
                    <td className="px-5 py-3 text-black font-medium">{order.customerName}</td>
                    <td className="px-5 py-3 text-black text-xs max-w-[180px] truncate" title={[order.address, order.city].filter(Boolean).join(", ") || undefined}>
                      {[order.address, order.city].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="px-5 py-3 text-black">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-black">
                      {Number(order.totalAmount)} {order.currency}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          statusColors[order.status] ?? "bg-gray-100 text-black"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-[#C9A84C] hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
