import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const collection = searchParams.get("collection");
  const status = searchParams.get("status");
  const lowStock = searchParams.get("low_stock");
  const search = searchParams.get("search");
  const sort = searchParams.get("sort") ?? "createdAt";
  const order = searchParams.get("order") ?? "desc";

  const where: Record<string, unknown> = {};
  if (collection) where.collectionId = collection;
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
    where.variants = {
      some: { stockQuantity: { lte: 5 } },
    };
  }

  const products = await prisma.product.findMany({
    where,
    include: {
      collection: { select: { id: true, name: true, slug: true } },
      variants: {
        include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      },
    },
    orderBy: { [sort]: order },
  });

  return NextResponse.json(products);
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }

  const body = await request.json();

  const {
    name,
    slug: slugInput,
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
    status = "active",
    featured = false,
    seoTitle,
    seoDescription,
    variants = [],
  } = body;

  if (!name) {
    return NextResponse.json(
      { error: { message: "Product name is required" } },
      { status: 400 }
    );
  }

  const slug =
    slugInput?.trim() ||
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const existing = await prisma.product.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json(
      { error: { message: "A product with this slug already exists" } },
      { status: 400 }
    );
  }

  const product = await prisma.product.create({
    data: {
      name,
      slug,
      shortDescription: shortDescription ?? null,
      longDescription: longDescription ?? null,
      collectionId: collectionId || null,
      frameStyle: frameStyle ?? null,
      genderTarget: Array.isArray(genderTarget) ? JSON.stringify(genderTarget) : (genderTarget || "[]"),
      frameMaterial: frameMaterial ?? null,
      lensType: lensType ?? null,
      lensColor: lensColor ?? null,
      templeLengthMm: templeLengthMm ?? null,
      bridgeWidthMm: bridgeWidthMm ?? null,
      lensWidthMm: lensWidthMm ?? null,
      weightGrams: weightGrams ?? null,
      status: status === "archived" ? "archived" : "active",
      featured: Boolean(featured),
      seoTitle: seoTitle ?? name,
      seoDescription: seoDescription ?? shortDescription ?? null,
    },
  });

  for (let i = 0; i < variants.length; i++) {
    const v = variants[i];
    await prisma.productVariant.create({
      data: {
        productId: product.id,
        colorName: v.colorName ?? "Default",
        colorHex: v.colorHex?.replace(/^#/, "") ?? null,
        sku: v.sku ?? `ORX-${product.slug}-${i + 1}`,
        priceMad: Number(v.priceMad ?? 0),
        priceEur: Number(v.priceEur ?? 0),
        comparePriceMad: v.comparePriceMad != null ? Number(v.comparePriceMad) : null,
        comparePriceEur: v.comparePriceEur != null ? Number(v.comparePriceEur) : null,
        stockQuantity: Number(v.stockQuantity ?? 0),
        lowStockThreshold: Number(v.lowStockThreshold ?? 5),
        isDefault: i === 0,
        sortOrder: i,
      },
    });
  }

  const created = await prisma.product.findUnique({
    where: { id: product.id },
    include: {
      collection: true,
      variants: {
        orderBy: { sortOrder: "asc" },
        include: { images: true },
      },
    },
  });

  return NextResponse.json(created);
}
