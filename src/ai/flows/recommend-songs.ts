// This is an AI-powered music recommendation system that suggests songs based on user input.
'use server';

/**
 * @fileOverview Recommends songs based on a text description of music preferences or an emotion.
 *
 * - recommendSongs - A function that recommends songs based on user input.
 * - RecommendSongsInput - The input type for the recommendSongs function.
 * - RecommendSongsOutput - The return type for the recommendSongs function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecommendSongsInputSchema = z.object({
  prompt: z.string().describe('A text description of the music the user likes, a mood, or an emotion.'),
});
export type RecommendSongsInput = z.infer<typeof RecommendSongsInputSchema>;

const RecommendSongsOutputSchema = z.object({
  recommendations: z.array(z.string()).describe('A list of recommended songs based on the user input.'),
});
export type RecommendSongsOutput = z.infer<typeof RecommendSongsOutputSchema>;

export async function recommendSongs(input: RecommendSongsInput): Promise<RecommendSongsOutput> {
  return recommendSongsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendSongsPrompt',
  input: {schema: RecommendSongsInputSchema},
  output: {schema: RecommendSongsOutputSchema},
  prompt: `You are a music recommendation expert. Based on the user's description of their music preferences, recommend a list of 10 songs.
The format of each recommendation must be "Song Title by Artist".

User preferences: {{{prompt}}}

Recommendations:`,
});

const recommendSongsFlow = ai.defineFlow(
  {
    name: 'recommendSongsFlow',
    inputSchema: RecommendSongsInputSchema,
    outputSchema: RecommendSongsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
