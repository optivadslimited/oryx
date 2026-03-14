import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-indigo-100 text-indigo-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  returned: "bg-orange-100 text-orange-800",
  cancelled: "bg-gray-100 text-gray-800",
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
      <h1 className="text-2xl font-serif font-semibold text-[#0A0F1E] mb-6">
        Orders
      </h1>

      <div className="flex flex-wrap gap-2 mb-4">
        <Link
          href="/admin/orders"
          className={`px-3 py-2 text-sm rounded ${!statusFilter ? "bg-[#1B2A4A] text-white" : "bg-[#E8E4DE] text-[#1A1A1A]"}`}
        >
          All
        </Link>
        {["pending", "confirmed", "processing", "shipped", "delivered", "returned", "cancelled"].map(
          (s) => (
            <Link
              key={s}
              href={`/admin/orders?status=${s}`}
              className={`px-3 py-2 text-sm rounded capitalize ${statusFilter === s ? "bg-[#1B2A4A] text-white" : "bg-[#E8E4DE] text-[#1A1A1A]"}`}
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
              <tr className="bg-[#F0EAE0] text-left text-[#888] uppercase tracking-wide">
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-[#888]">
                    No orders yet.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="border-t border-[#E8E4DE] hover:bg-[#FAF8F4]">
                    <td className="px-4 py-3 font-mono text-[#1A1A1A]">
                      {order.orderNumber}
                    </td>
                    <td className="px-4 py-3 text-[#1A1A1A]">
                      <p className="font-medium">{order.customerName}</p>
                      <p className="text-xs text-[#888]">{order.customerEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-[#1A1A1A]">{order.city ?? "—"}</td>
                    <td className="px-4 py-3 text-[#1A1A1A]">
                      {Number(order.totalAmount)} {order.currency}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${
                          STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#888]">
                      {new Date(order.createdAt).toLocaleString()}
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
