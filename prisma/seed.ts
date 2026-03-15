import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const rawEmail = process.env.ADMIN_EMAIL ?? "admin@oryxeyewear.com";
  const adminEmail = String(rawEmail).toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD ?? "OryxAdmin2026!";

  const existing = await prisma.adminUser.findUnique({
    where: { email: adminEmail },
  });

  if (existing) {
    console.log("Admin user already exists:", adminEmail);
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await prisma.adminUser.create({
    data: {
      email: adminEmail,
      passwordHash,
    },
  });

  console.log("Created admin user:", adminEmail);
  console.log("Default password:", adminPassword, "(change after first login)");

  // Seed default content blocks
  const blocks = [
    { key: "hero", title: "Hero", body: null, imageUrl: null, meta: {} },
    { key: "story", title: "Brand Story", body: null, imageUrl: null, meta: {} },
    { key: "footer", title: "Footer", body: null, imageUrl: null, meta: {} },
  ];

  for (const b of blocks) {
    await prisma.contentBlock.upsert({
      where: { key: b.key },
      create: b,
      update: {},
    });
  }

  console.log("Seeded content blocks.");

  // Default collection
  await prisma.collection.upsert({
    where: { slug: "launch-collection" },
    create: {
      name: "Launch Collection",
      slug: "launch-collection",
      description: "Inaugural Oryx Eyewear collection",
      isActive: true,
    },
    update: {},
  });

  console.log("Seeded default collection.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
