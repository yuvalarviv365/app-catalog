import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createReleaseSchema } from "@/lib/validations/release";

export async function GET(_req: Request, ctx: RouteContext<"/api/v1/apps/[slug]/releases">) {
  const { slug } = await ctx.params;

  const app = await prisma.app.findUnique({ where: { slug }, select: { id: true } });
  if (!app) {
    return Response.json({ error: "App not found" }, { status: 404 });
  }

  const releases = await prisma.release.findMany({
    where: { appId: app.id },
    include: {
      releasedBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { releaseDate: "desc" },
  });

  return Response.json(releases);
}

export async function POST(request: Request, ctx: RouteContext<"/api/v1/apps/[slug]/releases">) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
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

  const parsed = createReleaseSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const release = await prisma.release.create({
    data: {
      ...parsed.data,
      releaseDate: new Date(parsed.data.releaseDate),
      appId: app.id,
      releasedById: session.user.id,
    },
  });

  return Response.json(release, { status: 201 });
}
