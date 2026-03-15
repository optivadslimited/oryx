import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }

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

  if (!product) {
    return NextResponse.json({ error: { message: "Product not found" } }, { status: 404 });
  }

  return NextResponse.json(product);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.product.findUnique({
    where: { id },
    include: { variants: true },
  });
  if (!existing) {
    return NextResponse.json({ error: { message: "Product not found" } }, { status: 404 });
  }
  const variantIds = existing.variants.map((v) => v.id);

  const {
    name,
    slug,
    shortDescription,
    longDescription,
    collectionId,
    frameStyle,
    genderTarget,
    frameMaterial,
    lensType,
    lensColor,
    templeLengthMm,
    bridgeWidthMm,
    lensWidthMm,
    weightGrams,
    status,
    featured,
    seoTitle,
    seoDescription,
    variants,
  } = body;

  const productData: Record<string, unknown> = {};
  if (name != null) productData.name = name;
  if (slug != null) productData.slug = slug;
  if (shortDescription != null) productData.shortDescription = shortDescription;
  if (longDescription != null) productData.longDescription = longDescription;
  if (collectionId != null) productData.collectionId = collectionId || null;
  if (frameStyle != null) productData.frameStyle = frameStyle;
  if (genderTarget != null) productData.genderTarget = Array.isArray(genderTarget) ? JSON.stringify(genderTarget) : String(genderTarget || "[]");
  if (frameMaterial != null) productData.frameMaterial = frameMaterial;
  if (lensType != null) productData.lensType = lensType;
  if (lensColor != null) productData.lensColor = lensColor;
  if (templeLengthMm != null) productData.templeLengthMm = templeLengthMm;
  if (bridgeWidthMm != null) productData.bridgeWidthMm = bridgeWidthMm;
  if (lensWidthMm != null) productData.lensWidthMm = lensWidthMm;
  if (weightGrams != null) productData.weightGrams = weightGrams;
  if (status != null) productData.status = status;
  if (featured != null) productData.featured = featured;
  if (seoTitle != null) productData.seoTitle = seoTitle;
  if (seoDescription != null) productData.seoDescription = seoDescription;

  if (variants && Array.isArray(variants)) {
    const incomingIds = variants.filter((v: { id?: string }) => v.id).map((v: { id: string }) => v.id);

    for (const v of variants) {
      const variantPayload = {
        colorName: v.colorName,
        colorHex: v.colorHex?.replace(/^#/, "") ?? null,
        sku: v.sku,
        priceMad: Number(v.priceMad),
        priceEur: Number(v.priceEur),
        comparePriceMad: v.comparePriceMad != null ? Number(v.comparePriceMad) : null,
        comparePriceEur: v.comparePriceEur != null ? Number(v.comparePriceEur) : null,
        stockQuantity: Number(v.stockQuantity ?? 0),
        lowStockThreshold: Number(v.lowStockThreshold ?? 5),
        isDefault: Boolean(v.isDefault),
        sortOrder: Number(v.sortOrder ?? 0),
      };

      if (v.id && variantIds.includes(v.id)) {
        await prisma.productVariant.update({
          where: { id: v.id },
          data: variantPayload,
        });
      } else {
        await prisma.productVariant.create({
          data: {
            productId: id,
            ...variantPayload,
          },
        });
      }
    }

    for (const vid of variantIds) {
      if (!incomingIds.includes(vid)) {
        await prisma.productVariant.delete({ where: { id: vid } });
      }
    }
  }

  const updated = await prisma.product.update({
    where: { id },
    data: productData,
    include: {
      collection: true,
      variants: {
        orderBy: { sortOrder: "asc" },
        include: { images: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }

  const { id } = await params;

  // Soft delete: set status to archived
  await prisma.product.update({
    where: { id },
    data: { status: "archived" },
  });

  return NextResponse.json({ success: true });
}
