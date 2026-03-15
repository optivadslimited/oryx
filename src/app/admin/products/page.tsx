import Link from "next/link";
import { prisma } from "@/lib/db";
import ProductStatusToggle from "@/components/admin/ProductStatusToggle";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; low_stock?: string }>;
}) {
  const params = await searchParams;
  const search = params.search ?? "";
  const status = params.status;
  const lowStock = params.low_stock;

  const where: Record<string, unknown> = {};
  if (status === "archived") where.status = "archived";
  else if (status === "active") where.status = "active";
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
      { variants: { some: { sku: { contains: search, mode: "insensitive" } } } },
    ];
  }
  if (lowStock === "1") {
    where.variants = { some: { stockQuantity: { lte: 5 } } };
  }

  const products = await prisma.product.findMany({
    where,
    include: {
      collection: { select: { name: true } },
      variants: {
        include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-serif font-semibold text-black">
          Products
        </h1>
        <Link
          href="/admin/products/new"
          className="inline-block px-4 py-2 bg-[#1B2A4A] text-white text-sm font-medium uppercase tracking-wide hover:bg-[#C9A84C] hover:text-black"
        >
          + Add product
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <form method="get" className="flex gap-2 flex-1 min-w-[200px]">
          <input
            type="search"
            name="search"
            defaultValue={search}
            placeholder="Search by name, slug, SKU…"
            className="flex-1 px-3 py-2 border border-[#E8E4DE] rounded text-sm"
          />
          <button type="submit" className="px-3 py-2 bg-[#1B2A4A] text-white text-sm rounded">
            Search
          </button>
        </form>
        <div className="flex gap-2">
          <Link
            href="/admin/products?status=active"
            className={`px-3 py-2 text-sm rounded ${!status ? "bg-[#1B2A4A] text-white" : "bg-[#E8E4DE] text-black"}`}
          >
            Active
          </Link>
          <Link
            href="/admin/products?status=archived"
            className={`px-3 py-2 text-sm rounded ${status === "archived" ? "bg-[#1B2A4A] text-white" : "bg-[#E8E4DE] text-black"}`}
          >
            Archived
          </Link>
          <Link
            href="/admin/products?low_stock=1"
            className={`px-3 py-2 text-sm rounded ${lowStock === "1" ? "bg-amber-600 text-white" : "bg-[#E8E4DE] text-black"}`}
          >
            Low stock
          </Link>
        </div>
      </div>

      <div className="bg-white border border-[#E8E4DE] rounded shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F0EAE0] text-left text-black uppercase tracking-wide">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Price (MAD / EUR)</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-black">
                    No products yet. Add your first product to get started.
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const defaultVariant = product.variants.find((v) => v.isDefault) ?? product.variants[0];
                  const primaryImage = defaultVariant?.images[0];
                  return (
                    <tr key={product.id} className="border-t border-[#E8E4DE] hover:bg-[#FAF8F4]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-[#E8E4DE] rounded overflow-hidden flex-shrink-0">
                            {primaryImage ? (
                              <img
                                src={primaryImage.url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-black text-xs">
                                No img
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-black">{product.name}</p>
                            {product.collection && (
                              <p className="text-xs text-black">{product.collection.name}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-black">
                        {defaultVariant?.sku ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-black">
                        {defaultVariant
                          ? `${Number(defaultVariant.priceMad)} MAD / ${Number(defaultVariant.priceEur)} €`
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {product.variants.some((v) => v.stockQuantity <= 5) ? (
                          <span className="text-black font-medium">
                            {product.variants.map((v) => v.stockQuantity).join(", ")} (low)
                          </span>
                        ) : (
                          product.variants.map((v) => v.stockQuantity).join(", ")
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <ProductStatusToggle productId={product.id} status={product.status} />
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="text-[#C9A84C] hover:underline"
                        >
                          Edit
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
