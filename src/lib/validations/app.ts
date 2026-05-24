import { z } from "zod";
import { Platform, AppCategory, AppStatus } from "@/generated/prisma/enums";

export const createAppSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().optional(),
  platform: z.enum([Platform.WEB, Platform.IOS, Platform.ANDROID, Platform.CROSS_PLATFORM]),
  category: z.enum([AppCategory.LIVESCORES, AppCategory.CASINO, AppCategory.SPORTS, AppCategory.OTHER]),
  iconUrl: z.string().url().optional(),
  repositoryUrl: z.string().url().optional(),
  packageName: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/, "Must be a valid package name e.g. com.company.app").optional().or(z.literal("")),
  storeReleasedAt: z.string().datetime().optional().nullable(),
  redashName: z.string().optional(),
  status: z.enum([AppStatus.ACTIVE, AppStatus.DEPRECATED, AppStatus.SUNSET, AppStatus.NOT_ACTIVE]).optional(),
  ownerId: z.string().optional(),
});

export const updateAppSchema = createAppSchema.partial();

export type CreateAppInput = z.infer<typeof createAppSchema>;
export type UpdateAppInput = z.infer<typeof updateAppSchema>;
