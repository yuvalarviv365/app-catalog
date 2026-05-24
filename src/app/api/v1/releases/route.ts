import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const skip = (page - 1) * limit;

  const [releases, total] = await Promise.all([
    prisma.release.findMany({
      skip,
      take: limit,
      include: {
        app: { select: { id: true, name: true, slug: true } },
        releasedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { releaseDate: "desc" },
    }),
    prisma.release.count(),
  ]);

  return Response.json({
    data: releases,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
