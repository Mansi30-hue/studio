Core Technologies:

Framework: Next.js (using the App Router) is the foundation, providing a React-based structure for building the user interface with server-side capabilities.
Styling: The app uses Tailwind CSS for utility-first styling and ShadCN UI for its library of pre-built, accessible React components (like buttons, cards, and tabs).
Artificial Intelligence: Genkit is used as the framework to create and manage the AI-powered features. It connects to Google's Gemini models to perform tasks.
Key Features and Implementation:

AI Music Recommendation:

You can type in a prompt (e.g., "80s synth-pop"), and the app uses a Genkit flow (recommend-songs.ts) to ask the Gemini model for a list of 10 songs.
Another flow (generate-playlist-description.ts) then creates a catchy description for the generated playlist.
Song Identification:

The "Analyze Song" tab allows you to upload an audio file.
An AI flow (extract-song-metadata.ts) analyzes the audio to identify the song's title and artist.
Emotion-Based Playlists:

The "Emotion" tab lets you upload an image containing text.
One flow extracts the text (extract-text-from-image.ts), and a second flow (detect-emotion-from-text.ts) determines the emotion (e.g., "happy", "sad") from that text.
Finally, this emotion is used to generate a matching music playlist.
Backend Logic (Server Actions):

Instead of a traditional API, the project uses Next.js Server Actions (in src/lib/actions.ts). These are functions that run securely on the server, connecting the user interface directly to the AI flows without you having to write separate API endpoints.

https://github.com/user-attachments/assets/1b749e68-e705-41b3-8f3b-3a52e0e4616a


