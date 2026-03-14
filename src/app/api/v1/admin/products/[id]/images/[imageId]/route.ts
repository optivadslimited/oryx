import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { unlink } from "fs/promises";
import path from "path";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }

  const { imageId } = await params;

  const image = await prisma.productImage.findUnique({
    where: { id: imageId },
  });

  if (!image) {
    return NextResponse.json({ error: { message: "Image not found" } }, { status: 404 });
  }

  await prisma.productImage.delete({ where: { id: imageId } });

  if (image.url.startsWith("/uploads/")) {
    const filepath = path.join(process.cwd(), "public", image.url);
    try {
      await unlink(filepath);
    } catch {
      // ignore if file already removed
    }
  }

  return NextResponse.json({ success: true });
}
