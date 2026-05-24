import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { IncidentStatus, UserRole } from "@/generated/prisma/enums";

const updateIncidentSchema = z.object({
  status: z.enum([IncidentStatus.OPEN, IncidentStatus.INVESTIGATING, IncidentStatus.RESOLVED]).optional(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().min(1).optional(),
  resolvedAt: z.string().datetime().optional(),
});

export async function PATCH(request: Request, ctx: RouteContext<"/api/v1/incidents/[id]">) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as { role?: string }).role;
  if (role !== UserRole.ADMIN && role !== UserRole.PM) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;

  const existing = await prisma.incident.findUnique({ where: { id } });
  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateIncidentSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const data: Record<string, unknown> = { ...parsed.data };

  if (parsed.data.resolvedAt) {
    data.resolvedAt = new Date(parsed.data.resolvedAt);
  }

  if (parsed.data.status === IncidentStatus.RESOLVED && !data.resolvedAt) {
    data.resolvedAt = new Date();
  }

  const incident = await prisma.incident.update({
    where: { id },
    data,
    include: {
      app: { select: { id: true, name: true, slug: true } },
      market: { select: { id: true, name: true, code: true } },
      reportedBy: { select: { id: true, name: true, email: true } },
    },
  });

  return Response.json(incident);
}
