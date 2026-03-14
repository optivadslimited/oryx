import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }
  const collections = await prisma.collection.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(collections);
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }
  const body = await request.json();
  const { name, slug, description, coverImageUrl, isActive } = body;
  if (!name) {
    return NextResponse.json(
      { error: { message: "Name is required" } },
      { status: 400 }
    );
  }
  const slugVal =
    slug?.trim() ||
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  const collection = await prisma.collection.create({
    data: {
      name,
      slug: slugVal,
      description: description ?? null,
      coverImageUrl: coverImageUrl ?? null,
      isActive: isActive !== false,
    },
  });
  return NextResponse.json(collection);
}
