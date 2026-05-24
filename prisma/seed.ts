import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as never);

const MARKETS = [
  { name: "United Kingdom", code: "GB", region: "EMEA" as const, flagEmoji: "🇬🇧" },
  { name: "Germany", code: "DE", region: "EMEA" as const, flagEmoji: "🇩🇪" },
  { name: "France", code: "FR", region: "EMEA" as const, flagEmoji: "🇫🇷" },
  { name: "Spain", code: "ES", region: "EMEA" as const, flagEmoji: "🇪🇸" },
  { name: "Italy", code: "IT", region: "EMEA" as const, flagEmoji: "🇮🇹" },
  { name: "Netherlands", code: "NL", region: "EMEA" as const, flagEmoji: "🇳🇱" },
  { name: "Sweden", code: "SE", region: "EMEA" as const, flagEmoji: "🇸🇪" },
  { name: "Poland", code: "PL", region: "EMEA" as const, flagEmoji: "🇵🇱" },
  { name: "Portugal", code: "PT", region: "EMEA" as const, flagEmoji: "🇵🇹" },
  { name: "Romania", code: "RO", region: "EMEA" as const, flagEmoji: "🇷🇴" },
  { name: "Brazil", code: "BR", region: "LATAM" as const, flagEmoji: "🇧🇷" },
  { name: "Mexico", code: "MX", region: "LATAM" as const, flagEmoji: "🇲🇽" },
  { name: "Colombia", code: "CO", region: "LATAM" as const, flagEmoji: "🇨🇴" },
  { name: "Argentina", code: "AR", region: "LATAM" as const, flagEmoji: "🇦🇷" },
  { name: "Peru", code: "PE", region: "LATAM" as const, flagEmoji: "🇵🇪" },
  { name: "India", code: "IN", region: "APAC" as const, flagEmoji: "🇮🇳" },
  { name: "Japan", code: "JP", region: "APAC" as const, flagEmoji: "🇯🇵" },
  { name: "Australia", code: "AU", region: "APAC" as const, flagEmoji: "🇦🇺" },
  { name: "Philippines", code: "PH", region: "APAC" as const, flagEmoji: "🇵🇭" },
  { name: "Canada", code: "CA", region: "AMERICAS" as const, flagEmoji: "🇨🇦" },
  { name: "United States", code: "US", region: "AMERICAS" as const, flagEmoji: "🇺🇸" },
  { name: "South Africa", code: "ZA", region: "EMEA" as const, flagEmoji: "🇿🇦" },
];

const APPS = [
  // Livescores apps
  { name: "LiveScore Pro", slug: "livescore-pro", category: "LIVESCORES" as const, platform: "IOS" as const, description: "Real-time football scores and statistics" },
  { name: "LiveScore Pro Android", slug: "livescore-pro-android", category: "LIVESCORES" as const, platform: "ANDROID" as const, description: "Real-time football scores for Android" },
  { name: "LiveScore Web", slug: "livescore-web", category: "LIVESCORES" as const, platform: "WEB" as const, description: "Web-based live football scoring platform" },
  { name: "SportsPulse iOS", slug: "sportspulse-ios", category: "LIVESCORES" as const, platform: "IOS" as const, description: "Multi-sport live scores" },
  { name: "SportsPulse Android", slug: "sportspulse-android", category: "LIVESCORES" as const, platform: "ANDROID" as const, description: "Multi-sport live scores for Android" },
  { name: "ScoreHub", slug: "scorehub", category: "LIVESCORES" as const, platform: "CROSS_PLATFORM" as const, description: "Cross-platform live sports hub" },
  { name: "Goal Tracker", slug: "goal-tracker", category: "LIVESCORES" as const, platform: "IOS" as const, description: "Football goal tracking and alerts" },
  { name: "Match Center", slug: "match-center", category: "LIVESCORES" as const, platform: "WEB" as const, description: "Comprehensive match centre for all sports" },
  { name: "LiveBet Scores", slug: "livebet-scores", category: "LIVESCORES" as const, platform: "ANDROID" as const, description: "Live scores with integrated betting data" },
  { name: "FastScore", slug: "fastscore", category: "LIVESCORES" as const, platform: "CROSS_PLATFORM" as const, description: "Ultra-fast live score updates" },
  { name: "Tennis Live", slug: "tennis-live", category: "SPORTS" as const, platform: "IOS" as const, description: "Real-time tennis scores and stats" },
  { name: "Basketball Now", slug: "basketball-now", category: "SPORTS" as const, platform: "ANDROID" as const, description: "Live basketball scores NBA/EuroLeague" },
  // Casino apps
  { name: "Casino Royale iOS", slug: "casino-royale-ios", category: "CASINO" as const, platform: "IOS" as const, description: "Premium casino experience on iOS" },
  { name: "Casino Royale Android", slug: "casino-royale-android", category: "CASINO" as const, platform: "ANDROID" as const, description: "Premium casino experience on Android" },
  { name: "Casino Royale Web", slug: "casino-royale-web", category: "CASINO" as const, platform: "WEB" as const, description: "Desktop casino platform" },
  { name: "Slots Galaxy", slug: "slots-galaxy", category: "CASINO" as const, platform: "IOS" as const, description: "Slots-focused casino app" },
  { name: "Slots Galaxy Android", slug: "slots-galaxy-android", category: "CASINO" as const, platform: "ANDROID" as const, description: "Slots casino for Android" },
  { name: "Poker Pro", slug: "poker-pro", category: "CASINO" as const, platform: "CROSS_PLATFORM" as const, description: "Online poker platform" },
  { name: "Live Dealer Hub", slug: "live-dealer-hub", category: "CASINO" as const, platform: "WEB" as const, description: "Live dealer casino games" },
  { name: "BetMax Casino", slug: "betmax-casino", category: "CASINO" as const, platform: "IOS" as const, description: "High-stakes casino mobile app" },
  { name: "BetMax Casino Android", slug: "betmax-casino-android", category: "CASINO" as const, platform: "ANDROID" as const, description: "High-stakes casino for Android" },
  { name: "Lucky Spin", slug: "lucky-spin", category: "CASINO" as const, platform: "CROSS_PLATFORM" as const, description: "Casual slots and mini-games" },
  { name: "Jackpot City Web", slug: "jackpot-city-web", category: "CASINO" as const, platform: "WEB" as const, description: "Progressive jackpot web casino" },
  { name: "BlackJack Elite", slug: "blackjack-elite", category: "CASINO" as const, platform: "IOS" as const, description: "Premium blackjack experience" },
  { name: "Roulette Master", slug: "roulette-master", category: "CASINO" as const, platform: "ANDROID" as const, description: "European and American roulette" },
  { name: "VIP Casino Club", slug: "vip-casino-club", category: "CASINO" as const, platform: "WEB" as const, description: "VIP-tier casino experience" },
  { name: "Sports Betting iOS", slug: "sports-betting-ios", category: "SPORTS" as const, platform: "IOS" as const, description: "Sports betting app for iOS" },
  { name: "Sports Betting Android", slug: "sports-betting-android", category: "SPORTS" as const, platform: "ANDROID" as const, description: "Sports betting app for Android" },
  { name: "Fantasy Sports", slug: "fantasy-sports", category: "SPORTS" as const, platform: "CROSS_PLATFORM" as const, description: "Fantasy football and sports manager" },
  { name: "Odds Master Web", slug: "odds-master-web", category: "SPORTS" as const, platform: "WEB" as const, description: "Real-time odds comparison platform" },
  { name: "eSports Hub", slug: "esports-hub", category: "SPORTS" as const, platform: "WEB" as const, description: "eSports scores and betting platform" },
];

const HEALTH_STATUSES = ["HEALTHY", "HEALTHY", "HEALTHY", "HEALTHY", "DEGRADED", "OUTAGE", "UNKNOWN"] as const;
const RELEASE_TYPES = ["MAJOR", "MINOR", "MINOR", "PATCH", "PATCH", "HOTFIX"] as const;

function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
  console.log("🌱 Seeding database...");

  // Clean up
  await prisma.incident.deleteMany();
  await prisma.healthStatus.deleteMany();
  await prisma.release.deleteMany();
  await prisma.appMarket.deleteMany();
  await prisma.app.deleteMany();
  await prisma.market.deleteMany();
  await prisma.user.deleteMany();

  // Create admin user
  const passwordHash = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@company.com",
      role: "ADMIN",
      passwordHash,
    },
  });

  const pm = await prisma.user.create({
    data: {
      name: "Product Manager",
      email: "pm@company.com",
      role: "PM",
      passwordHash: await bcrypt.hash("pm123", 10),
    },
  });

  console.log("✅ Users created");

  // Create markets
  const markets = await Promise.all(
    MARKETS.map((m) =>
      prisma.market.create({ data: m })
    )
  );
  console.log(`✅ ${markets.length} markets created`);

  // Create apps
  const apps = await Promise.all(
    APPS.map((a) =>
      prisma.app.create({
        data: {
          ...a,
          status: "ACTIVE",
          ownerId: admin.id,
        },
      })
    )
  );
  console.log(`✅ ${apps.length} apps created`);

  // Assign markets to apps (each app gets 3-8 random markets)
  for (const app of apps) {
    const numMarkets = 3 + Math.floor(Math.random() * 6);
    const shuffled = [...markets].sort(() => Math.random() - 0.5).slice(0, numMarkets);
    await Promise.all(
      shuffled.map((market) =>
        prisma.appMarket.create({
          data: {
            appId: app.id,
            marketId: market.id,
            status: Math.random() > 0.1 ? "LIVE" : "SOFT_LAUNCH",
            launchDate: daysAgo(Math.floor(Math.random() * 365 + 30)),
          },
        })
      )
    );
  }
  console.log("✅ App-market assignments created");

  // Create releases for each app (2-5 releases each)
  for (const app of apps) {
    const numReleases = 2 + Math.floor(Math.random() * 4);
    for (let i = numReleases; i >= 1; i--) {
      await prisma.release.create({
        data: {
          appId: app.id,
          version: `${Math.floor(Math.random() * 3) + 1}.${i}.${Math.floor(Math.random() * 10)}`,
          platform: app.platform,
          releaseDate: daysAgo(i * 14),
          releaseType: randomItem(RELEASE_TYPES),
          releaseNotes: `Release notes for v${i}: Bug fixes, performance improvements, and new features.`,
          releasedById: admin.id,
        },
      });
    }
  }
  console.log("✅ Releases created");

  // Create health statuses
  for (const app of apps) {
    const appMarkets = await prisma.appMarket.findMany({ where: { appId: app.id } });
    for (const am of appMarkets) {
      // Latest status
      await prisma.healthStatus.create({
        data: {
          appId: app.id,
          marketId: am.marketId,
          status: randomItem(HEALTH_STATUSES),
          notes: Math.random() > 0.5 ? "All systems nominal" : undefined,
          reportedById: pm.id,
          createdAt: daysAgo(Math.floor(Math.random() * 3)),
        },
      });
    }
  }
  console.log("✅ Health statuses created");

  // Create a few open incidents
  const incidentApps = apps.slice(0, 5);
  for (const app of incidentApps) {
    if (Math.random() > 0.5) {
      await prisma.incident.create({
        data: {
          appId: app.id,
          title: `Performance degradation on ${app.name}`,
          severity: randomItem(["P1", "P2", "P3"] as const),
          status: randomItem(["OPEN", "INVESTIGATING"] as const),
          description: "Users reporting slow loading times. Engineering team investigating.",
          reportedById: pm.id,
          startedAt: daysAgo(Math.floor(Math.random() * 5)),
        },
      });
    }
  }
  console.log("✅ Incidents created");

  console.log("\n🎉 Seed complete!");
  console.log("   Admin login: admin@company.com / admin123");
  console.log("   PM login:    pm@company.com / pm123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
