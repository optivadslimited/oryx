import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

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
  const { name, slug, description, coverImageUrl, isActive, sortOrder } = body;
  const data: Record<string, unknown> = {};
  if (name != null) data.name = name;
  if (slug != null) data.slug = slug;
  if (description != null) data.description = description;
  if (coverImageUrl != null) data.coverImageUrl = coverImageUrl;
  if (typeof isActive === "boolean") data.isActive = isActive;
  if (sortOrder != null) data.sortOrder = Number(sortOrder);
  const collection = await prisma.collection.update({
    where: { id },
    data,
  });
  return NextResponse.json(collection);
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
  await prisma.collection.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
