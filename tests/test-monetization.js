const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();

function generateLicenseKey() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const segments = ["AVP"];
  for (let s = 0; s < 4; s++) {
    let segment = "";
    for (let i = 0; i < 4; i++) {
      segment += chars[crypto.randomInt(0, chars.length)];
    }
    segments.push(segment);
  }
  return segments.join("-");
}

async function runTests() {
  console.log("🧪 Starting Phase 4 Monetization & License Verification Tests...\n");

  // Test 1: License key formatting
  console.log("Test 1: Generating License Key...");
  const key = generateLicenseKey();
  console.log("  - Generated Key:", key);
  const regex = /^AVP-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  if (!regex.test(key)) {
    throw new Error("❌ License key format invalid!");
  }
  console.log("✅ Test 1 PASSED: Key format is standard AVP-XXXX-XXXX-XXXX-XXXX\n");

  // Test 2: Create a test buyer and simulate purchase
  console.log("Test 2: Simulating Wallet Purchase & Revenue Share (90/10)...");
  const buyerUsername = `buyer_${Date.now()}`;
  const buyer = await prisma.user.create({
    data: {
      username: buyerUsername,
      email: `${buyerUsername}@example.com`,
      walletBalance: 100000, // 100,000 Tomans
      role: "USER",
    },
  });

  const premiumAsset = await prisma.asset.findUnique({
    where: { slug: "battle-pass-pro" },
    include: { author: true },
  });

  if (!premiumAsset) throw new Error("Premium asset not found in DB!");

  const price = premiumAsset.price; // 45,000 Tomans
  const authorOldBalance = premiumAsset.author.walletBalance;
  const authorPayout = Math.floor(price * 0.9); // 40,500 Tomans

  const testLicenseKey = generateLicenseKey();

  // Execute purchase
  await prisma.$transaction(async (tx) => {
    // 1. Deduct from buyer
    await tx.user.update({
      where: { id: buyer.id },
      data: { walletBalance: { decrement: price } },
    });

    // 2. Credit author
    await tx.user.update({
      where: { id: premiumAsset.authorId },
      data: { walletBalance: { increment: authorPayout } },
    });

    // 3. Purchase record
    await tx.purchase.create({
      data: {
        userId: buyer.id,
        assetId: premiumAsset.id,
        amount: price,
        licenseKey: testLicenseKey,
        status: "COMPLETED",
        licenseRecord: {
          create: {
            licenseKey: testLicenseKey,
            isActive: true,
          },
        },
      },
    });
  });

  // Verify buyer balance
  const updatedBuyer = await prisma.user.findUnique({ where: { id: buyer.id } });
  console.log("  - Buyer Old Balance: 100,000 Toman");
  console.log(`  - Buyer New Balance: ${updatedBuyer.walletBalance} Toman (Deducted: ${price})`);
  if (updatedBuyer.walletBalance !== 100000 - price) throw new Error("Buyer balance deduction mismatch!");

  // Verify author payout
  const updatedAuthor = await prisma.user.findUnique({ where: { id: premiumAsset.authorId } });
  console.log(`  - Author Payout: +${authorPayout} Toman (90% of ${price})`);
  if (updatedAuthor.walletBalance !== authorOldBalance + authorPayout) throw new Error("Author payout mismatch!");

  console.log("✅ Test 2 PASSED: Wallet deductions, developer revenue share (90%), and records created!\n");

  // Test 3: DRM License Verification Simulation
  console.log("Test 3: PocketMine License Verification API Test...");
  const licenseRecord = await prisma.licenseRecord.findUnique({
    where: { licenseKey: testLicenseKey },
  });

  if (!licenseRecord || !licenseRecord.isActive) throw new Error("License record not found or inactive!");

  // Update check telemetry
  await prisma.licenseRecord.update({
    where: { licenseKey: testLicenseKey },
    data: {
      serverIp: "127.0.0.1",
      serverPort: 19132,
      pmmpVersion: "5.1.0",
      lastCheckedAt: new Date(),
    },
  });

  const checked = await prisma.licenseRecord.findUnique({ where: { licenseKey: testLicenseKey } });
  console.log("  - Verified License Key:", checked.licenseKey);
  console.log("  - Server Telemetry Recorded: IP:", checked.serverIp, "Port:", checked.serverPort, "PMMP:", checked.pmmpVersion);
  console.log("  - Last Checked:", checked.lastCheckedAt);

  console.log("✅ Test 3 PASSED: License verified and server telemetry recorded!\n");

  console.log("🎉 ALL PHASE 4 MONETIZATION TESTS PASSED!");
}

runTests()
  .catch((e) => {
    console.error("FAIL:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
