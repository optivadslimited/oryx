import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "products");
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const variantId = formData.get("variantId") as string | null;
  const altText = (formData.get("altText") as string) || "";
  const sortOrder = parseInt(String(formData.get("sortOrder") ?? "0"), 10);
  const isHover = formData.get("isHover") === "true";

  if (!file || !variantId) {
    return NextResponse.json(
      { error: { message: "file and variantId are required" } },
      { status: 400 }
    );
  }

  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json(
      { error: { message: "Only JPG, PNG, WebP allowed" } },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: { message: "File too large (max 10MB)" } },
      { status: 400 }
    );
  }

  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { product: true },
  });
  if (!variant) {
    return NextResponse.json(
      { error: { message: "Variant not found" } },
      { status: 404 }
    );
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const ext = path.extname(file.name) || ".jpg";
  const filename = `${variantId}-${Date.now()}${ext}`;
  const filepath = path.join(UPLOAD_DIR, filename);
  const bytes = await file.arrayBuffer();
  await writeFile(filepath, Buffer.from(bytes));

  const url = `/uploads/products/${filename}`;

  const image = await prisma.productImage.create({
    data: {
      variantId,
      url,
      urlWebp: null,
      altText: altText || undefined,
      sortOrder,
      isHover,
    },
  });

  return NextResponse.json(image);
}
