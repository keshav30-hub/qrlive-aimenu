
'use server';
/**
 * @fileOverview Flow for generating a combo description.
 * 
 * - generateComboDescription - A function that generates a description for a combo deal.
 * - GenerateComboDescriptionInput - The input type for the function.
 * - GenerateComboDescriptionOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateComboDescriptionInputSchema = z.object({
    comboName: z.string().describe('The name of the combo deal.'),
    items: z.array(z.string()).describe('A list of the names of the items included in the combo.'),
    price: z.string().describe('The total price of the combo deal.'),
});
export type GenerateComboDescriptionInput = z.infer<typeof GenerateComboDescriptionInputSchema>;

const GenerateComboDescriptionOutputSchema = z.object({
    description: z.string().describe('A short, appealing description for the combo, highlighting the value and items. Under 40 words.'),
});
export type GenerateComboDescriptionOutput = z.infer<typeof GenerateComboDescriptionOutputSchema>;

const prompt = ai.definePrompt({
    name: 'generateComboDescriptionPrompt',
    model: 'googleai/gemini-2.5-flash-lite',
    input: { schema: GenerateComboDescriptionInputSchema },
    output: { schema: GenerateComboDescriptionOutputSchema },
    prompt: `You are a marketing expert for a restaurant, tasked with writing a compelling description for a new combo deal.

    Based on the combo name, the items it includes, and its price, generate a short, delicious-sounding description (under 40 words) that encourages customers to buy it.
    
    Return ONLY the JSON object with the "description" field.

    Combo Name: {{{comboName}}}
    Items: {{#each items}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
    Price: {{{price}}}
    `,
});

const generateComboDescriptionFlow = ai.defineFlow(
  {
    name: 'generateComboDescriptionFlow',
    inputSchema: GenerateComboDescriptionInputSchema,
    outputSchema: GenerateComboDescriptionOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);


export async function generateComboDescription(input: GenerateComboDescriptionInput): Promise<GenerateComboDescriptionOutput> {
    return generateComboDescriptionFlow(input);
}
