import { config } from 'dotenv';
config();

import '@/ai/flows/extract-song-metadata.ts';
import '@/ai/flows/generate-playlist-description.ts';
import '@/ai/flows/recommend-songs.ts';
import '@/ai/flows/extract-text-from-image.ts';
import '@/ai/flows/detect-emotion-from-text.ts';
