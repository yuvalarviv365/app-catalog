import { prisma } from "@/lib/prisma";
import { HealthStatusValue, AppStatus, IncidentStatus } from "@/generated/prisma/enums";

export async function GET() {
  const [totalApps, activeApps, openIncidents, marketCount, healthStatuses] = await Promise.all([
    prisma.app.count(),
    prisma.app.count({ where: { status: AppStatus.ACTIVE } }),
    prisma.incident.count({
      where: {
        status: { in: [IncidentStatus.OPEN, IncidentStatus.INVESTIGATING] },
      },
    }),
    prisma.market.count(),
    prisma.healthStatus.findMany({
      where: {
        id: {
          in: await getLatestHealthStatusIds(),
        },
      },
      select: { status: true },
    }),
  ]);

  const healthCounts: Record<string, number> = {
    HEALTHY: 0,
    DEGRADED: 0,
    OUTAGE: 0,
    MAINTENANCE: 0,
    UNKNOWN: 0,
  };

  for (const hs of healthStatuses) {
    healthCounts[hs.status] = (healthCounts[hs.status] ?? 0) + 1;
  }

  return Response.json({
    total: totalApps,
    active: activeApps,
    openIncidents,
    marketCount,
    healthCounts: {
      HEALTHY: healthCounts[HealthStatusValue.HEALTHY],
      DEGRADED: healthCounts[HealthStatusValue.DEGRADED],
      OUTAGE: healthCounts[HealthStatusValue.OUTAGE],
      MAINTENANCE: healthCounts[HealthStatusValue.MAINTENANCE],
      UNKNOWN: healthCounts[HealthStatusValue.UNKNOWN],
    },
  });
}

async function getLatestHealthStatusIds(): Promise<string[]> {
  const apps = await prisma.app.findMany({
    select: { id: true },
  });

  const ids: string[] = [];

  await Promise.all(
    apps.map(async (app) => {
      const latest = await prisma.healthStatus.findFirst({
        where: { appId: app.id },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });
      if (latest) ids.push(latest.id);
    })
  );

  return ids;
}
