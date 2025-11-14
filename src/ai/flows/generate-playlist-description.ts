'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a short description of a playlist of recommended songs.
 *
 * The flow takes a list of song titles and artists as input and uses a language model to generate a concise and informative description
 * that captures the overall theme or mood of the playlist.
 *
 * @exported generatePlaylistDescription - An async function that takes a GeneratePlaylistDescriptionInput object and returns a
 * GeneratePlaylistDescriptionOutput object.
 * @exported GeneratePlaylistDescriptionInput - The input type for the generatePlaylistDescription function.
 * @exported GeneratePlaylistDescriptionOutput - The output type for the generatePlaylistDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePlaylistDescriptionInputSchema = z.object({
  songs: z
    .array(
      z.object({
        title: z.string().describe('The title of the song.'),
        artist: z.string().describe('The artist of the song.'),
      })
    )
    .describe('An array of song objects in the playlist.'),
   prompt: z.string().optional().describe('The original prompt or emotion that generated the playlist.'),
});
export type GeneratePlaylistDescriptionInput = z.infer<typeof GeneratePlaylistDescriptionInputSchema>;

const GeneratePlaylistDescriptionOutputSchema = z.object({
  description: z.string().describe('A short description of the playlist.'),
});
export type GeneratePlaylistDescriptionOutput = z.infer<typeof GeneratePlaylistDescriptionOutputSchema>;

export async function generatePlaylistDescription(
  input: GeneratePlaylistDescriptionInput
): Promise<GeneratePlaylistDescriptionOutput> {
  return generatePlaylistDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePlaylistDescriptionPrompt',
  input: {schema: GeneratePlaylistDescriptionInputSchema},
  output: {schema: GeneratePlaylistDescriptionOutputSchema},
  prompt: `You are a music expert. Generate a short description for a playlist.
The description should be no more than 2 sentences long and capture the overall theme or mood of the playlist.
{{#if prompt}}The playlist was generated based on the following theme: {{{prompt}}}{{/if}}

Here are the songs in the playlist:
{{#each songs}}
- {{this.title}} by {{this.artist}}
{{/each}}
`,
});

const generatePlaylistDescriptionFlow = ai.defineFlow(
  {
    name: 'generatePlaylistDescriptionFlow',
    inputSchema: GeneratePlaylistDescriptionInputSchema,
    outputSchema: GeneratePlaylistDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
