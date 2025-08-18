import { z } from 'zod';

export const createNoteSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  releaseAt: z.string().datetime(),
  webhookUrl: z.string().url()
});

