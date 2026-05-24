import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAppSchema } from "@/lib/validations/app";
import { UserRole } from "@/generated/prisma/enums";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get("platform") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const marketCode = searchParams.get("marketCode") ?? undefined;

  const where: Record<string, unknown> = {};
  if (platform) where.platform = platform;
  if (category) where.category = category;
  if (status) where.status = status;

  if (marketCode) {
    where.markets = {
      some: {
        market: { code: marketCode },
      },
    };
  }

  const apps = await prisma.app.findMany({
    where,
    include: {
      _count: { select: { markets: true } },
      health: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(apps);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ((session.user as { role?: string }).role !== UserRole.ADMIN) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { marketIds, ...rest } = body as Record<string, unknown>;
  const parsed = createAppSchema.safeParse(rest);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  try {
    // If marketIds were pre-detected (single import), use them directly.
    // Otherwise (bulk import), create the app first then detect markets server-side.
    const preDetected = Array.isArray(marketIds) && marketIds.length > 0

    const app = await prisma.app.create({
      data: {
        ...parsed.data,
        ...(preDetected
          ? {
              markets: {
                create: (marketIds as string[]).map((marketId) => ({
                  marketId,
                  status: "LIVE",
                  launchDate: new Date(),
                })),
              },
            }
          : {}),
      },
    });

    // Fire-and-forget: sync package-name → redashName mapping for the new app
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000"
    const secret  = process.env.SYNC_SECRET ?? ""
    fetch(`${baseUrl}/api/v1/sync/app-mapping`, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}` },
    }).catch(() => { /* non-critical, will retry on next daily cron */ })

    return Response.json(app, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error"
    // Unique constraint on slug or packageName
    if (message.includes("Unique constraint") || message.includes("unique constraint")) {
      if (message.includes("slug")) {
        return Response.json({ error: { message: "An app with this slug already exists." } }, { status: 409 });
      }
      if (message.includes("packageName")) {
        return Response.json({ error: { message: "An app with this package name already exists." } }, { status: 409 });
      }
      return Response.json({ error: { message: "Duplicate entry — app already exists." } }, { status: 409 });
    }
    const detail = err instanceof Error ? err.message : String(err)
    console.error("[POST /api/v1/apps]", detail);
    return Response.json({
      error: { message: process.env.NODE_ENV === "development" ? detail : "Failed to create app. Please try again." }
    }, { status: 500 });
  }
}
