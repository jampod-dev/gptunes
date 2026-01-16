import { refinePlaylistRequest } from '~/server/utils/llm';
import { batchSearchYouTubeTracks } from '~/server/utils/youtube';
import { batchSearchSpotifyTracks, getServiceSpotifyToken } from '~/server/utils/spotify';
import { checkRateLimit, getResetTime } from '~/server/utils/rateLimit';
import { useDatabase } from '~/server/utils/db';

export default defineEventHandler(async (event) => {
    const requestBody = await readBody(event);
    const {
        instruction,
        currentTracks,
        numberOfTracks,
        initialPrompt,
        playlistId,
        model = 'gemini-3-flash-preview',
        musicSource = 'youtube',
    } = requestBody;

    if (!instruction) {
        throw createError({
            statusCode: 400,
            message: 'Instruction is required',
        });
    }
    if (instruction.length > 1000) {
        throw createError({
            statusCode: 400,
            message: 'Instruction is too long (max 1000 characters)',
        });
    }
    if (!currentTracks || !Array.isArray(currentTracks)) {
        throw createError({
            statusCode: 400,
            message: 'Current tracks array is required',
        });
    }

    const maxTracks = 15;
    if (numberOfTracks > maxTracks || numberOfTracks < 1) {
        throw createError({
            statusCode: 400,
            message: `Number of tracks must be between 1 and ${maxTracks}.`,
        });
    }

    const clientIP = getRequestIP(event, { xForwardedFor: true }) || 'unknown';

    if (!checkRateLimit(clientIP, 60 * 60 * 1000)) {
        const resetTime = getResetTime(clientIP, 60 * 60 * 1000);
        const resetDate = resetTime ? new Date(resetTime) : null;
        const timeUntilReset = resetDate
            ? Math.ceil((resetDate.getTime() - Date.now()) / 60000)
            : 60;

        return {
            success: false,
            data: {
                code: 'QUOTA_REACHED',
                message: `You've hit the rate limit of playlists per hour. Please try again in ${timeUntilReset} minute${timeUntilReset !== 1 ? 's' : ''}.`,
                resetTime: resetDate?.toISOString(),
            },
        };
    }

    // Add track limit to the instruction for the LLM
    const limitedInstruction = `${instruction} (Note: The playlist must be ${numberOfTracks} in length)`;

    // Get refined tracks from LLM
    const result = await refinePlaylistRequest(
        currentTracks,
        limitedInstruction,
        initialPrompt,
        model
    );

    // Search for the new/updated tracks based on music source
    let batchResults;

    if (musicSource === 'spotify') {
        // Use Spotify search
        const serviceToken = await getServiceSpotifyToken();
        batchResults = await batchSearchSpotifyTracks({
            token: serviceToken,
            refreshToken: '',
            tracks: result.data,
        });
    } else {
        // Default to YouTube search
        batchResults = await batchSearchYouTubeTracks({
            tracks: result.data,
        });
    }

    // Filter out tracks not found
    batchResults = batchResults.filter((track) => track.id !== null);

    // Enforce track limit (in case LLM doesn't respect it)
    if (batchResults.length > maxTracks) {
        batchResults = batchResults.slice(0, maxTracks);
    }

    // Save refinement to database
    const sql = useDatabase();
    if (playlistId) {
        await sql`
            INSERT INTO refinements (playlist_id, description, title, tracks)
            VALUES (${playlistId}, ${instruction}, ${result.playlistTitle || 'Untitled Playlist'}, ${JSON.stringify(batchResults)})
        `;
    }

    return {
        success: true,
        data: batchResults,
        playlistTitle: result.playlistTitle,
        message: result.message,
        maxTracks, // Include limit so frontend knows
    };
});
