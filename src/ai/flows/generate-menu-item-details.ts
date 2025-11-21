'use server';
/**
 * @fileOverview Flow for generating menu item details.
 * 
 * - generateMenuItemDetails - A function that generates a description and kcal for a menu item.
 * - GenerateMenuItemDetailsInput - The input type for the generateMenuItemDetails function.
 * - GenerateMenuItemDetailsOutput - The return type for the generateMenuItemDetails function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const GenerateMenuItemDetailsInputSchema = z.object({
    itemName: z.string().describe('The name of the menu item.'),
    ingredients: z.string().describe('A comma-separated list of ingredients.'),
    type: z.string().describe('The type of the item (e.g., veg, non-veg).'),
});
export type GenerateMenuItemDetailsInput = z.infer<typeof GenerateMenuItemDetailsInputSchema>;

export const GenerateMenuItemDetailsOutputSchema = z.object({
    description: z.string().describe('A delicious and appealing description for the menu item, under 30 words.'),
    kcal: z.number().describe('An estimated calorie count (kcal) for the item.'),
});
export type GenerateMenuItemDetailsOutput = z.infer<typeof GenerateMenuItemDetailsOutputSchema>;

const prompt = ai.definePrompt({
    name: 'generateMenuItemDetailsPrompt',
    input: { schema: GenerateMenuItemDetailsInputSchema },
    output: { schema: GenerateMenuItemDetailsOutputSchema },
    prompt: `You are a creative chef and food writer for a restaurant menu. 
    Based on the item name, ingredients, and type, generate a short, delicious-sounding description (under 30 words) and an estimated calorie count (kcal). 
    
    Return ONLY the JSON object with the "description" and "kcal" fields.

    Item Name: {{{itemName}}}
    Ingredients: {{{ingredients}}}
    Type: {{{type}}}
    `,
});

const generateMenuItemDetailsFlow = ai.defineFlow(
  {
    name: 'generateMenuItemDetailsFlow',
    inputSchema: GenerateMenuItemDetailsInputSchema,
    outputSchema: GenerateMenuItemDetailsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);


export async function generateMenuItemDetails(input: GenerateMenuItemDetailsInput): Promise<GenerateMenuItemDetailsOutput> {
    return generateMenuItemDetailsFlow(input);
}

    