interface Song {
    artist: string;
    title: string;
}
import type RepairOptions from './../../lib/repair-json';
import type { GenerateContentParameters } from '@google/genai';
import { jsonrepair } from 'jsonrepair';

import { GoogleGenAI, ThinkingLevel } from '@google/genai';

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient() {
    if (!geminiClient) {
        geminiClient = new GoogleGenAI({ apiKey: process.env.NUXT_GEMINI_API_KEY });
    }
    return geminiClient;
}

function parseMarkdownJson(input: string): Song[] {
    // Remove backticks and language identifier from the beginning and end
    const cleanInput = input
        .replace(/^`{1,3}json\n?/i, '') // Remove opening ```json
        .replace(/\n?`{1,3}$/, '') // Remove closing ```
        .replace('"]', '"}]')
        .replace('.}]', '."}]'); // Fix the end of the array if it was broken
    // add quotes around keys and values

    try {
        // Parse the cleaned JSON string
        const parsed = JSON.parse(cleanInput);

        // Validate that it's an array
        if (!Array.isArray(parsed)) {
            throw new Error('Expected an array');
        }

        // Validate each item has the expected structure
        parsed.forEach((item, index) => {
            if (typeof item !== 'object' || item === null) {
                throw new Error(`Item at index ${index} is not an object`);
            }
            if (typeof item.artist !== 'string' || typeof item.title !== 'string') {
                throw new Error(`Item at index ${index} is missing required string properties`);
            }
        });

        return parsed as Song[];
    } catch (error) {
        throw new Error(
            `Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
    }
}

function shuffleArray(array) {
    // Iterate over the array from the last element down to the second
    for (let i = array.length - 1; i > 0; i--) {
        // Generate a random index 'j' between 0 and 'i' (inclusive)
        const j = Math.floor(Math.random() * (i + 1));

        // Swap elements at indices 'i' and 'j'
        // This uses array destructuring for a concise swap
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export type LLMModel = 'gemini-3-flash-preview' | 'gemini-3-flash-pro-preview';

export async function makeLLMRequest(
    description: string,
    trackCount: number = 10,
    model: LLMModel = 'gemini-3-flash-preview'
) {
    const systemPrompt =
        'As a music librarian and radio DJ, you possess extensive knowledge across all music genres, specializing in discovering obscure tracks beyond mainstream radio play. Your expertise lies in curating playlists that precisely match user-defined criteria with precision and enthusiasm.';

    const prompt = `Please make a playlist of ${trackCount} songs based on this description: ${description}. 
    
For each song, include the artist, title, and a reason for including the song. Also create a creative, catchy title for the playlist that captures its essence.

Please format your response as a JSON object with this structure:
{
  "playlistTitle": "Your Creative Playlist Title",
  "tracks": [{"artist": "artist name", "title": "song title", "reason": "reason for inclusion"}]
}

Do not include any other text in the reply. Very important: each song in the list must be a real song that exists.`;

    model = 'gemini-3-flash-preview';

    let reply: string | null | undefined = null;

    const maxTokens = trackCount * 240;

    if (model.startsWith('gemini')) {
        const params: GenerateContentParameters = {
            model: model,
            contents: prompt,
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: 'application/json',
                maxOutputTokens: maxTokens,
            },
        };
        if (model.includes('-flash-')) {
            params.config.thinkingConfig = {
                thinkingBudget: 0,
            };
        } else if (model.includes('-pro-')) {
            params.config.thinkingConfig = {
                thinkingLevel: ThinkingLevel.LOW,
            };
        }

        const result = await getGeminiClient().models.generateContent(params);
        reply = result.text;
    } else {
        throw new Error('Unknown model');
    }

    try {
        const trimmedReply = reply!.trim();

        // Check if response is newline-delimited JSON (multiple JSON objects separated by newlines)
        const lines = trimmedReply.split('\n').filter((line) => line.trim());
        if (lines.length > 1 && lines.every((line) => line.trim().startsWith('{'))) {
            // Parse each line as a separate JSON object
            const data = lines.map((line) => {
                const repaired = jsonrepair(line.trim());
                return JSON.parse(repaired);
            });
            return { data };
        }

        const repaired = jsonrepair(trimmedReply);
        const parsed = JSON.parse(repaired);

        // Handle various response formats
        let data;
        let playlistTitle = '';

        if (parsed.playlistTitle) {
            playlistTitle = parsed.playlistTitle;
        }

        if (Array.isArray(parsed)) {
            data = parsed;
        } else if (parsed.tracks) {
            data = parsed.tracks;
        } else if (parsed.playlist) {
            data = parsed.playlist;
        } else if (parsed.artist && parsed.title) {
            // Single song object - wrap in array
            data = [parsed];
        } else {
            data = parsed;
        }

        return {
            data,
            playlistTitle,
        };
    } catch (e) {
        throw new Error(
            `Failed to parse JSON: ${e instanceof Error ? e.message : 'Unknown error'}`
        );
    }
}

export async function refinePlaylistRequest(
    currentTracks: Array<{ artist: string; title: string; reason?: string }>,
    instruction: string,
    initialPrompt: string,
    model: LLMModel = 'gemini-3-flash-preview'
) {
    const systemPrompt =
        'As a music librarian, you possess extensive knowledge across all music genres. You are helping the user refine and improve their playlist based on their feedback.';

    const tracksJson = JSON.stringify(
        currentTracks.map((t) => ({ artist: t.artist, title: t.title, reason: t.reason || '' }))
    );

    const prompt = `The user has a playlist with these tracks:
${tracksJson}

created with this initial prompt: ${initialPrompt}

The user wants to modify this playlist with the following instruction: "${instruction}"

Based on their request, provide an updated playlist. You can:
- Add new tracks that fit the request
- Remove tracks that don't fit
- Reorder tracks
- Keep tracks that still fit

Also suggest an updated title if the playlist theme has changed significantly.

Please format your response as a JSON object with this structure:
{
  "playlistTitle": "Updated Playlist Title (or original if unchanged)",
  "tracks": [{"artist": "artist name", "title": "song title", "reason": "reason for inclusion"}],
  "message": "Brief explanation of what changes you made"
}

Do not include any other text in the reply. Every song must be a real song that exists.`;

    let reply: string | null | undefined = null;
    model = 'gemini-3-flash-preview';
    const maxTokens = 4000;

    if (model.startsWith('gemini')) {
        const params: GenerateContentParameters = {
            model: model,
            contents: prompt,
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: 'application/json',
                maxOutputTokens: maxTokens,
            },
        };

        const response = await getGeminiClient().models.generateContent(params);
        reply = response.text;
    }
    // else if (model.startsWith('gpt')) {
    //     const response = await openAIClient.chat.completions.create({
    //         model: model,
    //         messages: [
    //             { role: 'system', content: systemPrompt },
    //             { role: 'user', content: prompt },
    //         ],
    //         max_tokens: maxTokens,
    //     });
    //     reply = response.choices[0].message.content;
    // }
    // else if (model.startsWith('kimi') || model.startsWith('moonshotai')) {
    //     const response = await kimiClient.chat.completions.create({
    //         model: model,
    //         messages: [
    //             { role: 'system', content: systemPrompt },
    //             { role: 'user', content: prompt },
    //         ],
    //         max_tokens: maxTokens,
    //     });
    //     reply = response.choices[0].message.content;
    // }

    if (!reply) {
        throw new Error('No response from LLM');
    }

    try {
        const trimmedReply = reply.trim();
        const repaired = jsonrepair(trimmedReply);
        const parsed = JSON.parse(repaired);

        return {
            data: parsed.tracks || [],
            playlistTitle: parsed.playlistTitle || '',
            message: parsed.message || '',
        };
    } catch (e) {
        throw new Error(
            `Failed to parse JSON: ${e instanceof Error ? e.message : 'Unknown error'}`
        );
    }
}
