import { z } from 'zod';
import { DeepPartial } from 'ai';

export const planSchema = z.array(
  z.object({
    title: z.string().max(15),
    description: z.string().max(50),
    steps: z.array(z.string()).min(3).max(6),
    step_num: z.number(),
    advantages: z.array(z.string()).min(2),
  })
);

export type PartialInquiry = DeepPartial<typeof planSchema>;
