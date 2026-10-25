import { z } from 'zod';
export const GenerateReviewsRequestSchema = z.object({
  tenantId: z.uuid(), experience: z.string().trim().min(10).max(1000), rating: z.number().int().min(1).max(5).optional()
});
export const AiReviewsOutputSchema = z.object({ suggestion: z.string().trim().min(10).max(1200) });
