import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Region, UserRole } from "@/generated/prisma/enums";

const createMarketSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(2).max(10).toUpperCase(),
  region: z.enum([Region.EMEA, Region.LATAM, Region.APAC, Region.AMERICAS]),
  flagEmoji: z.string().optional(),
});

export async function GET() {
  const markets = await prisma.market.findMany({
    include: {
      _count: { select: { apps: true } },
    },
    orderBy: { name: "asc" },
  });

  return Response.json(markets);
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

  const parsed = createMarketSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const market = await prisma.market.create({ data: parsed.data });
  return Response.json(market, { status: 201 });
}
