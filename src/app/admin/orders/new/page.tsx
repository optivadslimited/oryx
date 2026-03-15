import Link from "next/link";
import { prisma } from "@/lib/db";
import ManualOrderForm from "@/components/admin/ManualOrderForm";

export const dynamic = "force-dynamic";

export default async function NewManualOrderPage() {
  const products = await prisma.product.findMany({
    where: { status: "active" },
    select: {
      id: true,
      name: true,
      variants: {
        select: {
          id: true,
          colorName: true,
          sku: true,
          priceMad: true,
          priceEur: true,
          stockQuantity: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const productsWithNumericPrices = products.map((p) => ({
    ...p,
    variants: p.variants.map((v) => ({
      ...v,
      priceMad: Number(v.priceMad),
      priceEur: Number(v.priceEur),
    })),
  }));

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/orders" className="text-black hover:text-black">
          ← Orders CRM
        </Link>
        <h1 className="text-2xl font-serif font-semibold text-black">
          Create manual order
        </h1>
      </div>

      {productsWithNumericPrices.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded p-5 text-black">
          <p className="font-medium">No active products</p>
          <p className="text-sm mt-1">
            Add at least one active product with variants before creating a manual order.
          </p>
          <Link
            href="/admin/products/new"
            className="inline-block mt-3 text-sm text-black hover:underline"
          >
            Add product →
          </Link>
        </div>
      ) : (
        <ManualOrderForm products={productsWithNumericPrices} />
      )}
    </div>
  );
}
