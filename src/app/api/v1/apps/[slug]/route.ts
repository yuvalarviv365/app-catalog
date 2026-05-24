import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateAppSchema } from "@/lib/validations/app";
import { AppStatus, UserRole } from "@/generated/prisma/enums";

export async function GET(_req: Request, ctx: RouteContext<"/api/v1/apps/[slug]">) {
  const { slug } = await ctx.params;

  const app = await prisma.app.findUnique({
    where: { slug },
    include: {
      markets: {
        include: {
          market: true,
        },
      },
      health: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      releases: {
        orderBy: { releaseDate: "desc" },
        take: 10,
      },
      owner: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!app) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(app);
}

export async function PUT(request: Request, ctx: RouteContext<"/api/v1/apps/[slug]">) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ((session.user as { role?: string }).role !== UserRole.ADMIN) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { slug } = await ctx.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateAppSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const existing = await prisma.app.findUnique({ where: { slug } });
  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const app = await prisma.app.update({
    where: { slug },
    data: parsed.data,
  });

  return Response.json(app);
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/v1/apps/[slug]">) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ((session.user as { role?: string }).role !== UserRole.ADMIN) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { slug } = await ctx.params;

  const existing = await prisma.app.findUnique({ where: { slug } });
  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const app = await prisma.app.update({
    where: { slug },
    data: { status: AppStatus.SUNSET },
  });

  return Response.json(app);
}
