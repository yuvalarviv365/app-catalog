import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, ctx: RouteContext<"/api/v1/markets/[code]">) {
  const { code } = await ctx.params;

  const market = await prisma.market.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      apps: {
        include: {
          app: {
            include: {
              health: {
                orderBy: { createdAt: "desc" },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  if (!market) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(market);
}
