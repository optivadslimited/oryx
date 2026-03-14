/**
 * Delivery company webhook: call this URL to update order status from your delivery API.
 * Configure webhook secret in Admin → Settings (DELIVERY_WEBHOOK_SECRET).
 *
 * POST body (JSON):
 * {
 *   "order_number": "ORX-20260001",   // or "tracking_number" if you use that as id
 *   "status": "shipped" | "delivered" | "returned",
 *   "tracking_number": "optional",
 *   "secret": "<DELIVERY_WEBHOOK_SECRET>"
 * }
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const ALLOWED_STATUSES = ["shipped", "delivered", "returned"];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_number, tracking_number, status, secret } = body;

    const expectedSecret = process.env.DELIVERY_WEBHOOK_SECRET;
    if (!expectedSecret || secret !== expectedSecret) {
      return NextResponse.json(
        { error: { message: "Invalid webhook secret" } },
        { status: 401 }
      );
    }

    if (!order_number || !status) {
      return NextResponse.json(
        { error: { message: "order_number and status are required" } },
        { status: 400 }
      );
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: { message: `status must be one of: ${ALLOWED_STATUSES.join(", ")}` } },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber: order_number },
    });

    if (!order) {
      return NextResponse.json(
        { error: { message: "Order not found" } },
        { status: 404 }
      );
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: status as "shipped" | "delivered" | "returned",
        ...(tracking_number && { trackingNumber: tracking_number }),
      },
    });

    return NextResponse.json({ success: true, order_number, status });
  } catch (e) {
    console.error("Delivery webhook error:", e);
    return NextResponse.json(
      { error: { message: "Webhook failed" } },
      { status: 500 }
    );
  }
}
