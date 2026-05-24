import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { IncidentSeverity, IncidentStatus, UserRole } from "@/generated/prisma/enums";

const createIncidentSchema = z.object({
  appId: z.string().min(1),
  marketId: z.string().optional(),
  title: z.string().min(1).max(255),
  severity: z.enum([IncidentSeverity.P1, IncidentSeverity.P2, IncidentSeverity.P3]),
  description: z.string().min(1),
  startedAt: z.string().datetime().optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;
  const appId = searchParams.get("appId") ?? undefined;
  const severity = searchParams.get("severity") ?? undefined;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (appId) where.appId = appId;
  if (severity) where.severity = severity;

  const incidents = await prisma.incident.findMany({
    where,
    include: {
      app: { select: { id: true, name: true, slug: true } },
      market: { select: { id: true, name: true, code: true } },
      reportedBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { startedAt: "desc" },
  });

  return Response.json(incidents);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as { role?: string }).role;
  if (role !== UserRole.ADMIN && role !== UserRole.PM) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createIncidentSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const incident = await prisma.incident.create({
    data: {
      appId: parsed.data.appId,
      marketId: parsed.data.marketId,
      title: parsed.data.title,
      severity: parsed.data.severity,
      description: parsed.data.description,
      status: IncidentStatus.OPEN,
      startedAt: parsed.data.startedAt ? new Date(parsed.data.startedAt) : new Date(),
      reportedById: session.user.id,
    },
  });

  return Response.json(incident, { status: 201 });
}
