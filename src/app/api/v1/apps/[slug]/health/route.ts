import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createHealthStatusSchema } from "@/lib/validations/health";
import { UserRole } from "@/generated/prisma/enums";

export async function GET(_req: Request, ctx: RouteContext<"/api/v1/apps/[slug]/health">) {
  const { slug } = await ctx.params;

  const app = await prisma.app.findUnique({ where: { slug }, select: { id: true } });
  if (!app) {
    return Response.json({ error: "App not found" }, { status: 404 });
  }

  const history = await prisma.healthStatus.findMany({
    where: { appId: app.id },
    include: {
      market: { select: { id: true, name: true, code: true } },
      reportedBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(history);
}

export async function POST(request: Request, ctx: RouteContext<"/api/v1/apps/[slug]/health">) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as { role?: string }).role;
  if (role !== UserRole.ADMIN && role !== UserRole.PM) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { slug } = await ctx.params;

  const app = await prisma.app.findUnique({ where: { slug }, select: { id: true } });
  if (!app) {
    return Response.json({ error: "App not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createHealthStatusSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  if (parsed.data.appId !== app.id) {
    return Response.json({ error: "appId mismatch" }, { status: 400 });
  }

  const healthStatus = await prisma.healthStatus.create({
    data: {
      appId: app.id,
      marketId: parsed.data.marketId,
      status: parsed.data.status,
      notes: parsed.data.notes,
      reportedById: session.user.id,
    },
  });

  return Response.json(healthStatus, { status: 201 });
}
