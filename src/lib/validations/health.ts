import { z } from "zod";
import { HealthStatusValue } from "@/generated/prisma/enums";

export const createHealthStatusSchema = z.object({
  appId: z.string().min(1),
  marketId: z.string().optional(),
  status: z.enum([
    HealthStatusValue.HEALTHY,
    HealthStatusValue.DEGRADED,
    HealthStatusValue.OUTAGE,
    HealthStatusValue.MAINTENANCE,
    HealthStatusValue.UNKNOWN,
  ]),
  notes: z.string().optional(),
});

export type CreateHealthStatusInput = z.infer<typeof createHealthStatusSchema>;
