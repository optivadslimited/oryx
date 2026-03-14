import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminCollectionsPage() {
  const collections = await prisma.collection.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-serif font-semibold text-[#0A0F1E] mb-6">
        Collections
      </h1>
      <p className="text-sm text-[#888] mb-4">
        Assign products to collections from the product edit page. Create collections here.
      </p>
      <div className="space-y-3">
        {collections.map((c) => (
          <div
            key={c.id}
            className="bg-white border border-[#E8E4DE] rounded p-4 flex items-center justify-between"
          >
            <div>
              <p className="font-medium text-[#1A1A1A]">{c.name}</p>
              <p className="text-sm text-[#888]">
                /{c.slug} · {c._count.products} products
                {!c.isActive && " · Hidden"}
              </p>
            </div>
          </div>
        ))}
        {collections.length === 0 && (
          <p className="text-[#888]">No collections yet. Create one via API or add a seed.</p>
        )}
      </div>
    </div>
  );
}
