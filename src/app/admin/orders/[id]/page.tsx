import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import OrderStatusForm from "@/components/admin/OrderStatusForm";

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

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) notFound();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/orders" className="text-black hover:text-black">
          ← Orders CRM
        </Link>
        <h1 className="text-2xl font-serif font-semibold text-black">
          Order {order.orderNumber}
        </h1>
        <span
          className={`inline-block px-3 py-1 rounded text-sm font-medium capitalize ${
            STATUS_COLORS[order.status] ?? "bg-gray-100 text-black"
          }`}
        >
          {order.status}
        </span>
      </div>

      <OrderStatusForm
        orderId={order.id}
        currentStatus={order.status}
        trackingNumber={order.trackingNumber}
        trackingProvider={order.trackingProvider}
        adminNotes={order.adminNotes}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-white border border-[#E8E4DE] rounded p-6">
          <h2 className="text-lg font-semibold text-black mb-4">Customer</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-black">Name</dt>
              <dd className="text-black font-medium">{order.customerName}</dd>
            </div>
            <div>
              <dt className="text-black">Email</dt>
              <dd className="text-black">{order.customerEmail}</dd>
            </div>
            <div>
              <dt className="text-black">Phone</dt>
              <dd className="text-black">{order.customerPhone}</dd>
            </div>
            <div>
              <dt className="text-black">City</dt>
              <dd className="text-black">{order.city ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-black">Address</dt>
              <dd className="text-black">{order.address ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-black">Country</dt>
              <dd className="text-black">{order.country}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white border border-[#E8E4DE] rounded p-6">
          <h2 className="text-lg font-semibold text-black mb-4">Payment & notes</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-black">Payment method</dt>
              <dd className="text-black capitalize">{order.paymentMethod.replace("_", " ")}</dd>
            </div>
            {order.paymentNotes && (
              <div>
                <dt className="text-black">Payment notes</dt>
                <dd className="text-black">{order.paymentNotes}</dd>
              </div>
            )}
            {order.specialNotes && (
              <div>
                <dt className="text-black">Customer notes</dt>
                <dd className="text-black">{order.specialNotes}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      <div className="bg-white border border-[#E8E4DE] rounded p-6 mt-6">
        <h2 className="text-lg font-semibold text-black mb-4">Items</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-black uppercase tracking-wide border-b border-[#E8E4DE]">
              <th className="pb-3">Product</th>
              <th className="pb-3">SKU</th>
              <th className="pb-3">Qty</th>
              <th className="pb-3 text-right">Unit price</th>
              <th className="pb-3 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b border-[#E8E4DE]">
                <td className="py-3 text-black">
                  {item.productName}
                  {item.colorName && (
                    <span className="text-black ml-1">({item.colorName})</span>
                  )}
                </td>
                <td className="py-3 font-mono text-black">{item.sku}</td>
                <td className="py-3 text-black">{item.quantity}</td>
                <td className="py-3 text-right text-black">
                  {order.currency === "MAD"
                    ? `${Number(item.unitPriceMad)} MAD`
                    : `${Number(item.unitPriceEur)} €`}
                </td>
                <td className="py-3 text-right font-medium text-black">
                  {order.currency === "MAD"
                    ? `${Number(item.unitPriceMad) * item.quantity} MAD`
                    : `${Number(item.unitPriceEur) * item.quantity} €`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-right font-semibold text-black mt-4">
          Total: {Number(order.totalAmount)} {order.currency}
        </p>
      </div>

      <p className="text-xs text-black mt-6">
        Created: {new Date(order.createdAt).toLocaleString()}
        {order.updatedAt.getTime() !== order.createdAt.getTime() && (
          <> · Updated: {new Date(order.updatedAt).toLocaleString()}</>
        )}
      </p>
    </div>
  );
}
