import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // 1. Seed Categories
  const categories = [
    {
      name: "Plugins",
      slug: "plugins",
      description: "PocketMine-MP plugins (.phar) to enhance your server gameplay and mechanics.",
      icon: "Puzzle",
    },
    {
      name: "Virions",
      slug: "virions",
      description: "Reusable PHP libraries and frameworks designed for PMMP plugin developers.",
      icon: "Library",
    },
    {
      name: "Maps & Worlds",
      slug: "maps",
      description: "Custom Bedrock worlds, spawns, hubs, arenas, BedWars, and SkyBlock schematics.",
      icon: "Map",
    },
    {
      name: "Models & Entities",
      slug: "models",
      description: "Custom Blockbench 3D models, textures, and entity animations for PMMP.",
      icon: "Box",
    },
    {
      name: "Server Setups",
      slug: "setups",
      description: "Ready-to-run preconfigured servers, economy setups, and full minigame bundles.",
      icon: "Server",
    },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
  }
  console.log("✅ Categories seeded.");

  // 2. Seed an initial Admin / Developer User
  const passwordHash = await bcrypt.hash("Admin@123456", 10);
  const demoUser = await prisma.user.upsert({
    where: { username: "slappir" },
    update: {},
    create: {
      username: "slappir",
      email: "tag20craft23@gmail.com",
      name: "Amirali Farhadi",
      passwordHash: passwordHash,
      role: "ADMIN",
      walletBalance: 150000,
      bio: "Founder & Lead Developer of AvPocket. Building open-source tools for PocketMine-MP.",
      githubUsername: "ArentComing",
      avatarUrl: "https://github.com/ArentComing.png",
    },
  });
  console.log("✅ Admin user seeded (username: slappir).");

  // 3. Seed an initial showcase plugin
  const pluginCategory = await prisma.category.findUnique({ where: { slug: "plugins" } });
  if (pluginCategory) {
    const demoAsset = await prisma.asset.upsert({
      where: { slug: "economy-core" },
      update: {},
      create: {
        title: "EconomyCore",
        slug: "economy-core",
        shortDescription: "High-performance asynchronous economy engine for PocketMine-MP with multi-currency support.",
        descriptionMarkdown: `# EconomyCore for PocketMine-MP

A robust, enterprise-grade economy management plugin for Minecraft Bedrock PocketMine-MP servers.

## Features
- ⚡ **Asynchronous SQLite/MySQL:** Zero lag on transactions.
- 💰 **Multi-Currency:** Support for Coins, Gems, Tokens, and Event Points.
- 🔄 **Auto-Sync:** Cross-server sync for networked servers.
- 📦 **API Support:** Drop-in replacement for EconomyAPI with extended async callbacks.

## PocketMine API Compatibility
- Compatible with **PM4** and **PM5** (API \`5.0.0\`).
`,
        type: "PLUGIN",
        pricingType: "FREE",
        price: 0,
        status: "APPROVED",
        authorId: demoUser.id,
        categoryId: pluginCategory.id,
        sourceCodeUrl: "https://github.com/ArentComing/AvPocket",
        totalDownloads: 128,
        ratingAvg: 5.0,
        ratingCount: 3,
        versions: {
          create: {
            versionNumber: "1.0.0",
            changelog: "Initial stable release supporting PocketMine-MP 5.0.0",
            channel: "STABLE",
            targetApi: "5.0.0",
            minApi: "5.0.0",
            maxApi: "5.99.0",
            filePath: "demo/EconomyCore_v1.0.0.phar",
            fileName: "EconomyCore.phar",
            fileSize: 45200,
            fileHashSha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            virionsJson: JSON.stringify(["poggit/libasynql"]),
            downloadCount: 128,
          },
        },
      },
    });
    console.log(`✅ Sample plugin seeded: ${demoAsset.title}`);
  }

  console.log("🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
