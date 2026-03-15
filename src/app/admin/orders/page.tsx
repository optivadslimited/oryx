import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-black",
  confirmed: "bg-blue-100 text-black",
  processing: "bg-indigo-100 text-black",
  shipped: "bg-purple-100 text-black",
  delivered: "bg-green-100 text-black",
  returned: "bg-orange-100 text-black",
  cancelled: "bg-gray-100 text-black",
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: statusFilter } = await searchParams;

  const where: Record<string, unknown> = {};
  if (statusFilter) where.status = statusFilter;

  const orders = await prisma.order.findMany({
    where,
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-serif font-semibold text-black">
          Orders CRM
        </h1>
        <Link
          href="/admin/orders/new"
          className="inline-block px-4 py-2 bg-[#1B2A4A] text-white text-sm font-medium uppercase tracking-wide hover:bg-[#C9A84C] hover:text-black"
        >
          Create manual order
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Link
          href="/admin/orders"
          className={`px-3 py-2 text-sm rounded ${!statusFilter ? "bg-[#1B2A4A] text-white" : "bg-[#E8E4DE] text-black"}`}
        >
          All
        </Link>
        {["pending", "confirmed", "processing", "shipped", "delivered", "returned", "cancelled"].map(
          (s) => (
            <Link
              key={s}
              href={`/admin/orders?status=${s}`}
              className={`px-3 py-2 text-sm rounded capitalize ${statusFilter === s ? "bg-[#1B2A4A] text-white" : "bg-[#E8E4DE] text-black"}`}
            >
              {s}
            </Link>
          )
        )}
      </div>

      <div className="bg-white border border-[#E8E4DE] rounded shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F0EAE0] text-left text-black uppercase tracking-wide">
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Full Name</th>
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Total Rev</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-black">
                    No orders yet.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const productNames = [...new Set(order.items.map((i) => i.productName))].join(" & ") || "—";
                  return (
                  <tr key={order.id} className="border-t border-[#E8E4DE] hover:bg-[#FAF8F4]">
                    <td className="px-4 py-3 font-mono text-black">
                      {order.orderNumber}
                    </td>
                    <td className="px-4 py-3 text-black text-xs max-w-[200px]" title={productNames}>
                      <span className="line-clamp-2">{productNames}</span>
                    </td>
                    <td className="px-4 py-3 text-black font-medium">
                      {order.customerName}
                    </td>
                    <td className="px-4 py-3 text-black text-xs max-w-[200px] truncate" title={[order.address, order.city].filter(Boolean).join(", ") || undefined}>
                      {[order.address, order.city].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-black">
                      {new Date(order.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-black">
                      {Number(order.totalAmount)} {order.currency}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${
                          STATUS_COLORS[order.status] ?? "bg-gray-100 text-black"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
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
