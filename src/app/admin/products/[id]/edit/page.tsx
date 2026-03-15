import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import ProductForm from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      collection: true,
      variants: {
        orderBy: { sortOrder: "asc" },
        include: { images: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });

  if (!product) notFound();

  const collections = await prisma.collection.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  const formProduct = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription ?? "",
    longDescription: product.longDescription ?? "",
    collectionId: product.collectionId,
    frameStyle: product.frameStyle ?? "",
    genderTarget: typeof product.genderTarget === "string" ? (JSON.parse(product.genderTarget || "[]") as string[]) : product.genderTarget,
    frameMaterial: product.frameMaterial ?? "",
    lensType: product.lensType ?? "",
    lensColor: product.lensColor ?? "",
    templeLengthMm: product.templeLengthMm,
    bridgeWidthMm: product.bridgeWidthMm,
    lensWidthMm: product.lensWidthMm,
    weightGrams: product.weightGrams,
    status: product.status,
    featured: product.featured,
    seoTitle: product.seoTitle ?? product.name,
    seoDescription: product.seoDescription ?? "",
    variants: product.variants.map((v) => ({
      id: v.id,
      colorName: v.colorName,
      colorHex: v.colorHex ? `#${v.colorHex}` : "#000000",
      sku: v.sku,
      priceMad: Number(v.priceMad),
      priceEur: Number(v.priceEur),
      comparePriceMad: v.comparePriceMad != null ? Number(v.comparePriceMad) : null,
      comparePriceEur: v.comparePriceEur != null ? Number(v.comparePriceEur) : null,
      stockQuantity: v.stockQuantity,
      lowStockThreshold: v.lowStockThreshold,
      isDefault: v.isDefault,
      sortOrder: v.sortOrder,
      images: v.images.map((img) => ({
        id: img.id,
        url: img.url,
        altText: img.altText,
        sortOrder: img.sortOrder,
      })),
    })),
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/products" className="text-black hover:text-black">
          ← Products
        </Link>
        <h1 className="text-2xl font-serif font-semibold text-black">
          Edit: {product.name}
        </h1>
      </div>
      <ProductForm collections={collections} product={formProduct} />
    </div>
  );
}
