import type { PrismaClient } from "@prisma/client";
import { prisma } from "./db";

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

type Client = PrismaClient | Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends">;

/**
 * Generate an order number: 3-letter month + 4 random digits (e.g. MAR3434).
 * Pass `tx` when called inside a transaction to avoid duplicates under concurrency.
 */
export async function generateOrderNumber(tx?: Client): Promise<string> {
  const client = (tx ?? prisma) as PrismaClient;
  const month = MONTHS[new Date().getMonth()];
  const maxAttempts = 20;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const digits = String(Math.floor(1000 + Math.random() * 9000)); // 1000–9999
    const orderNumber = `${month}${digits}`;

    const existing = await client.order.findUnique({
      where: { orderNumber },
      select: { id: true },
    });
    if (!existing) return orderNumber;
  }

  // Fallback: month + timestamp last 4 digits to guarantee uniqueness
  const fallback = `${month}${String(Date.now() % 10000).padStart(4, "0")}`;
  return fallback;
}
