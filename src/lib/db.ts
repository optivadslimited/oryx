import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// In dev: resolve relative file: URL to absolute path (no Node "path" module = Edge-safe)
if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
  const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  if (url.startsWith("file:")) {
    const filePath = url.replace(/^file:\.?\//, "").replace(/^file:/, "").trim();
    const isAbsolute = filePath.startsWith("/") || /^[A-Za-z]:/.test(filePath);
    if (!isAbsolute) {
      const cwd = process.cwd();
      const normalized = filePath.replace(/^\.\//, "");
      const absolute = cwd.endsWith("/") ? cwd + normalized : `${cwd}/${normalized}`;
      process.env.DATABASE_URL = `file:${absolute}`;
    }
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
