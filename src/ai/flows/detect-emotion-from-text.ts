'use server';

/**
 * @fileOverview A flow to detect the dominant emotion from a piece of text.
 *
 * - detectEmotionFromText - A function that handles the emotion detection process.
 * - DetectEmotionFromTextInput - The input type for the detectEmotionFromText function.
 * - DetectEmotionFromTextOutput - The return type for the detectEmotionFromText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EmotionEnum = z.enum(["happy", "sad", "angry", "neutral", "fear", "surprise"]);
export type Emotion = z.infer<typeof EmotionEnum>;

const DetectEmotionFromTextInputSchema = z.object({
  text: z.string().describe('The text to analyze for emotion.'),
});
export type DetectEmotionFromTextInput = z.infer<typeof DetectEmotionFromTextInputSchema>;

const DetectEmotionFromTextOutputSchema = z.object({
  emotion: EmotionEnum.describe('The detected emotion.'),
});
export type DetectEmotionFromTextOutput = z.infer<typeof DetectEmotionFromTextOutputSchema>;

export async function detectEmotionFromText(input: DetectEmotionFromTextInput): Promise<DetectEmotionFromTextOutput> {
  return detectEmotionFromTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectEmotionFromTextPrompt',
  input: {schema: DetectEmotionFromTextInputSchema},
  output: {schema: DetectEmotionFromTextOutputSchema},
  prompt: `You are an expert emotion detector. Analyze the following text and determine the dominant emotion.

Choose one of the following emotions: "happy", "sad", "angry", "neutral", "fear", "surprise".

Text: {{{text}}}`,
});

const detectEmotionFromTextFlow = ai.defineFlow(
  {
    name: 'detectEmotionFromTextFlow',
    inputSchema: DetectEmotionFromTextInputSchema,
    outputSchema: DetectEmotionFromTextOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
