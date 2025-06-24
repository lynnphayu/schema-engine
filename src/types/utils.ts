import type { z } from "zod";

export type ValidatedRequest<T extends z.ZodTypeAny> = {
  validated: z.infer<T>;
};
