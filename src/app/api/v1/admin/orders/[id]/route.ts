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
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) {
    return NextResponse.json({ error: { message: "Order not found" } }, { status: 404 });
  }

  return NextResponse.json(order);
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

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { variant: true } } },
  });

  if (!order) {
    return NextResponse.json({ error: { message: "Order not found" } }, { status: 404 });
  }

  const prevStatus = order.status;
  const newStatus = body.status as string | undefined;
  const trackingNumber = body.trackingNumber as string | undefined;
  const trackingProvider = body.trackingProvider as string | undefined;
  const adminNotes = body.adminNotes as string | undefined;

  const updateData: Record<string, unknown> = {};
  if (newStatus) updateData.status = newStatus;
  if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber;
  if (trackingProvider !== undefined) updateData.trackingProvider = trackingProvider;
  if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

  // When moving to confirmed, deduct stock
  if (newStatus === "confirmed" && prevStatus === "pending") {
    for (const item of order.items) {
      if (item.variant) {
        await prisma.productVariant.update({
          where: { id: item.variantId },
          data: {
            stockQuantity: { decrement: item.quantity },
          },
        });
      }
    }
  }

  // When cancelling a confirmed order, restore stock
  if (newStatus === "cancelled" && prevStatus === "confirmed") {
    for (const item of order.items) {
      if (item.variant) {
        await prisma.productVariant.update({
          where: { id: item.variantId },
          data: {
            stockQuantity: { increment: item.quantity },
          },
        });
      }
    }
  }

  const updated = await prisma.order.update({
    where: { id },
    data: updateData,
    include: { items: true },
  });

  return NextResponse.json(updated);
}
