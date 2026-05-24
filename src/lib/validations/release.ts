import { z } from "zod";
import { Platform, ReleaseType } from "@/generated/prisma/enums";

export const createReleaseSchema = z.object({
  version: z.string().min(1).max(50),
  platform: z.enum([Platform.WEB, Platform.IOS, Platform.ANDROID, Platform.CROSS_PLATFORM]),
  releaseDate: z.string().datetime(),
  releaseType: z.enum([ReleaseType.MAJOR, ReleaseType.MINOR, ReleaseType.PATCH, ReleaseType.HOTFIX]),
  releaseNotes: z.string().min(1),
  storeUrl: z.string().url().optional(),
});

export type CreateReleaseInput = z.infer<typeof createReleaseSchema>;
