// Seed script — LOCAL TESTING ONLY. Never run against production.
//
// Creates clearly-marked SAMPLE data so you can click through the whole
// marketplace locally: an admin, two sample creators with packages, a sample
// brand, two sample bookings and one sample review.
//
// Run:  npm run db:seed        (or: npx prisma db seed)
// Test logins (local only):
//   Admin:   admin@demo.local   / Demo1234!
//   Creator: creator@demo.local / Demo1234!
//   Brand:   brand@demo.local   / Demo1234!
//
// The script refuses to run when NODE_ENV=production, and it upserts by
// email so re-running it does not duplicate the sample accounts.

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Load .env for DATABASE_URL (Node 22.6+ built-in; no dotenv dependency).
process.loadEnvFile?.();

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to seed: NODE_ENV=production. This script is for local testing only.");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Copy .env.example to .env and fill it in first.");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const PASSWORD_HASH = await bcrypt.hash("Demo1234!", 12);

async function upsertUser(email, name, role) {
  return prisma.user.upsert({
    where: { email },
    update: { name, role },
    create: { email, name, role, passwordHash: PASSWORD_HASH },
  });
}

async function main() {
  console.log("Seeding SAMPLE data (local testing only)...");

  // Admin
  await upsertUser("admin@demo.local", "Sample Admin", "ADMIN");

  // Creator 1 — published + verified, with packages
  const creator1 = await upsertUser("creator@demo.local", "Alex Carter", "CREATOR");
  const profile1 = await prisma.creatorProfile.upsert({
    where: { userId: creator1.id },
    update: {},
    create: {
      userId: creator1.id,
      displayName: "Alex Carter (SAMPLE)",
      tagline: "GTA VI gameplay, clips and chaos from Leonida",
      bio: "Sample creator profile for local testing. I post daily GTA VI clips, full gameplay walkthroughs and funny moments from Vice City.",
      platforms: ["YOUTUBE", "TIKTOK"],
      primaryPlatform: "YOUTUBE",
      followers: 84200,
      avgViews: 31200,
      engagementRate: 6.4,
      audienceCountries: ["United States", "United Kingdom", "Canada"],
      niches: ["Gameplay", "Clips & Shorts", "Funny Moments"],
      portfolioLinks: ["https://www.youtube.com", "https://www.tiktok.com"],
      verificationStatus: "VERIFIED",
      featured: true,
      isPublished: true,
    },
  });
  await prisma.package.upsert({
    where: { id: "sample-package-1" },
    update: {},
    create: {
      id: "sample-package-1",
      creatorId: profile1.id,
      type: "SHORT",
      title: "Sponsored Short (60s)",
      description: "Your game or product featured in a 60-second GTA VI short.",
      priceCents: 15000,
      deliveryDays: 5,
    },
  });
  await prisma.package.upsert({
    where: { id: "sample-package-2" },
    update: {},
    create: {
      id: "sample-package-2",
      creatorId: profile1.id,
      type: "DEDICATED_VIDEO",
      title: "Dedicated video (8–12 min)",
      description: "A full video built around your brand, published on my channel.",
      priceCents: 80000,
      deliveryDays: 10,
    },
  });

  // Creator 2 — published, pending verification
  const creator2 = await upsertUser("creator2@demo.local", "Maya Lopez", "CREATOR");
  const profile2 = await prisma.creatorProfile.upsert({
    where: { userId: creator2.id },
    update: {},
    create: {
      userId: creator2.id,
      displayName: "Maya Lopez (SAMPLE)",
      tagline: "GTA roleplay streams from Leonida",
      bio: "Sample creator profile for local testing. RP streams four nights a week.",
      platforms: ["TWITCH", "KICK"],
      primaryPlatform: "TWITCH",
      followers: 12400,
      avgViews: 2800,
      engagementRate: 8.1,
      audienceCountries: ["United States", "Brazil"],
      niches: ["Roleplay (RP)", "Live Streams"],
      portfolioLinks: ["https://www.twitch.tv"],
      verificationStatus: "PENDING",
      isPublished: true,
    },
  });
  await prisma.package.upsert({
    where: { id: "sample-package-3" },
    update: {},
    create: {
      id: "sample-package-3",
      creatorId: profile2.id,
      type: "STREAM_MENTION",
      title: "Stream mention + overlay",
      description: "Live shout-out plus your logo on stream for one session.",
      priceCents: 9000,
      deliveryDays: 3,
    },
  });

  // Brand + sample bookings
  const brand = await upsertUser("brand@demo.local", "Neon Games", "BRAND");
  const brandProfile = await prisma.brandProfile.upsert({
    where: { userId: brand.id },
    update: {},
    create: {
      userId: brand.id,
      companyName: "Neon Games (SAMPLE)",
      website: "https://example.com",
      description: "Sample brand account for local testing.",
    },
  });

  const respondBy = new Date(Date.now() + 72 * 60 * 60 * 1000);
  await prisma.booking.upsert({
    where: { id: "sample-booking-1" },
    update: {},
    create: {
      id: "sample-booking-1",
      creatorId: profile1.id,
      brandId: brandProfile.id,
      packageId: "sample-package-1",
      title: "Sponsored Short — Neon Games launch",
      brief: "Sample booking for local testing. Feature our new game in a 60-second short.",
      priceCents: 15000,
      commissionRate: 15,
      commissionCents: 2250,
      status: "REQUESTED",
      respondBy,
    },
  });
  const paidBooking = await prisma.booking.upsert({
    where: { id: "sample-booking-2" },
    update: {},
    create: {
      id: "sample-booking-2",
      creatorId: profile1.id,
      brandId: brandProfile.id,
      packageId: "sample-package-2",
      title: "Dedicated video — Neon Games review",
      brief: "Sample completed booking for local testing.",
      priceCents: 80000,
      commissionRate: 15,
      commissionCents: 12000,
      status: "PAID",
      respondBy,
      paymentMethod: "PAYONEER",
      paymentStatus: "CONFIRMED",
    },
  });
  await prisma.review.upsert({
    where: { bookingId: paidBooking.id },
    update: {},
    create: {
      bookingId: paidBooking.id,
      creatorId: profile1.id,
      brandId: brandProfile.id,
      rating: 5,
      comment: "Sample review for local testing. Great communication, video performed well.",
    },
  });

  await prisma.platformSetting.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, commissionRate: 15 },
  });

  console.log("Seed complete. Test logins: admin@demo.local / creator@demo.local / brand@demo.local (all Demo1234!)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
