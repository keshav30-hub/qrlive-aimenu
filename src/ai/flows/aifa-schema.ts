
import { z } from 'zod';

export const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

export const MenuCategorySchema = z.object({
  name: z.string(),
  description: z.string().optional(),
});

export const MenuItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  price: z.string(),
  type: z.enum(['veg', 'non-veg']),
  description: z.string(),
  kcal: z.string(),
  tags: z.array(z.string()),
});
export type MenuItemSchema = z.infer<typeof MenuItemSchema>;

export const EventSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  datetime: z.string(),
  organizers: z.array(z.string()).optional(),
  terms: z.string().optional(),
  active: z.boolean(),
});

export const AIFALowInputSchema = z.object({
  businessName: z.string(),
  priceSymbol: z.string().default('$'),
  googleReviewLink: z.string().optional().nullable(),
  instagramLink: z.string().optional().nullable(),
  menuCategories: z.array(MenuCategorySchema),
  menuItems: z.array(MenuItemSchema),
  events: z.array(EventSchema),
  history: z.array(MessageSchema),
  prompt: z.string(),
});
export type AIFALowInput = z.infer<typeof AIFALowInputSchema>;

export const AIFALowOutputSchema = z.string();
export type AIFALowOutput = z.infer<typeof AIFALowOutputSchema>;
