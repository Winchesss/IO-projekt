import { UserRole } from "@prisma/client";
import { z } from "zod";

export const roleChangeSchema = z.object({
  userId: z.string().min(1),
  role: z.union([z.literal(UserRole.ARBITER), z.literal(UserRole.PLAYER)])
});
