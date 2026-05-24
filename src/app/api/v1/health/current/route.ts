import { prisma } from "@/lib/prisma";

export async function GET() {
  const apps = await prisma.app.findMany({
    include: {
      markets: {
        include: {
          market: true,
        },
      },
      health: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const result = apps.flatMap((app) => {
    if (app.markets.length === 0) {
      const latest = app.health.find((h) => h.marketId === null) ?? app.health[0];
      return [
        {
          appId: app.id,
          appName: app.name,
          appSlug: app.slug,
          appIconUrl: app.iconUrl ?? null,
          marketCode: null as string | null,
          marketName: null as string | null,
          status: latest?.status ?? ("UNKNOWN" as const),
          updatedAt: latest?.createdAt ?? null,
        },
      ];
    }

    return app.markets.map(({ market }) => {
      const latest =
        app.health.find((h) => h.marketId === market.id) ??
        app.health.find((h) => h.marketId === null) ??
        app.health[0];

      return {
        appId: app.id,
        appName: app.name,
        appSlug: app.slug,
        appIconUrl: app.iconUrl ?? null,
        marketCode: market.code as string | null,
        marketName: market.name as string | null,
        // Default to HEALTHY for apps live in a market — UNKNOWN only when no market assigned
        status: latest?.status ?? ("HEALTHY" as const),
        updatedAt: latest?.createdAt ?? null,
      };
    });
  });

  return Response.json(result);
}
