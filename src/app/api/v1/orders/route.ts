import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateOrderNumber } from "@/lib/order-number";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      customerName,
      customerPhone,
      customerEmail,
      city,
      address,
      country = "Morocco",
      paymentMethod,
      paymentNotes,
      specialNotes,
      affiliateCode,
      items,
    } = body;

    if (!customerName || !customerPhone || !customerEmail) {
      return NextResponse.json(
        { error: { message: "Name, phone and email are required" } },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: { message: "At least one item is required" } },
        { status: 400 }
      );
    }

    const currency = country === "Morocco" ? "MAD" : "EUR";
    const validPayment = ["cod", "bank_transfer", "other"].includes(paymentMethod)
      ? paymentMethod
      : "cod";

    let totalAmount = 0;
    const orderItems: {
      variantId: string;
      productName: string;
      colorName: string;
      sku: string;
      quantity: number;
      unitPriceMad: number;
      unitPriceEur: number;
    }[] = [];

    for (const item of items as { variantId: string; quantity: number }[]) {
      if (!item.variantId || !item.quantity) {
        return NextResponse.json(
          { error: { message: "Each item must have variantId and quantity" } },
          { status: 400 }
        );
      }
      const variant = await prisma.productVariant.findUnique({
        where: { id: item.variantId },
        include: { product: true },
      });
      if (!variant) {
        return NextResponse.json(
          { error: { message: `Variant ${item.variantId} not found` } },
          { status: 400 }
        );
      }
      const requestedQty = Number(item.quantity);
      if (!Number.isInteger(requestedQty) || requestedQty < 1 || requestedQty > 10) {
        return NextResponse.json(
          {
            error: {
              message: `Quantity for variant ${item.variantId} must be between 1 and 10 (got ${item.quantity})`,
            },
          },
          { status: 400 }
        );
      }
      const qty = requestedQty;
      const unitMad = Number(variant.priceMad);
      const unitEur = Number(variant.priceEur);
      totalAmount += (currency === "MAD" ? unitMad : unitEur) * qty;
      orderItems.push({
        variantId: variant.id,
        productName: variant.product.name,
        colorName: variant.colorName,
        sku: variant.sku,
        quantity: qty,
        unitPriceMad: unitMad,
        unitPriceEur: unitEur,
      });
    }

    const order = await prisma.$transaction(async (tx) => {
      const orderNumber = await generateOrderNumber(tx);
      return tx.order.create({
        data: {
          orderNumber,
          customerName: String(customerName).trim(),
          customerPhone: String(customerPhone).trim(),
          customerEmail: String(customerEmail).trim(),
          city: city ? String(city).trim() : null,
          address: address ? String(address).trim() : null,
          country: String(country).trim(),
          paymentMethod: validPayment,
          paymentNotes: paymentNotes ? String(paymentNotes).trim() : null,
          specialNotes: specialNotes ? String(specialNotes).trim() : null,
          status: "pending",
          currency,
          totalAmount,
          affiliateCode: affiliateCode ? String(affiliateCode).trim().slice(0, 50) : null,
          items: {
            create: orderItems.map((oi) => ({
              variantId: oi.variantId,
              productName: oi.productName,
              colorName: oi.colorName,
              sku: oi.sku,
              quantity: oi.quantity,
              unitPriceMad: oi.unitPriceMad,
              unitPriceEur: oi.unitPriceEur,
            })),
          },
        },
        include: { items: true },
      });
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalAmount: Number(order.totalAmount),
      currency: order.currency,
    });
  } catch (e) {
    console.error("Order creation error:", e);
    return NextResponse.json(
      { error: { message: "Failed to create order" } },
      { status: 500 }
    );
  }
}

