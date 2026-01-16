import { makeLLMRequest } from '~/server/utils/llm';
import { batchSearchYouTubeTracks } from '~/server/utils/youtube';
import { batchSearchSpotifyTracks, getServiceSpotifyToken } from '~/server/utils/spotify';
import { checkRateLimit, getRemainingRequests, getResetTime } from '~/server/utils/rateLimit';
import { useDatabase } from '~/server/utils/db';

const TRACK_LIMIT = 15;

export default defineEventHandler(async (event) => {
    const requestBody = await readBody(event);
    const { description, trackCount, model = 'gemini-3-flash', musicSource = 'youtube' } = requestBody;

    if (!description) {
        throw createError({
            statusCode: 400,
            message: 'Description is required',
        });
    }
    if (trackCount > TRACK_LIMIT) {
        throw createError({
            statusCode: 400,
            message: `You can only request up to ${TRACK_LIMIT} tracks.`,
        });
    }
    if (trackCount < 0 || trackCount === 0) {
        throw createError({
            statusCode: 400,
            message: `Track count must be at least 1.`,
        });
    }
    if (description.length < 10) {
        throw createError({
            statusCode: 400,
            message: 'Description is too short (min 10 characters)',
        });
    }
    if (description.length > 1000) {
        throw createError({
            statusCode: 400,
            message: 'Description is too long (max 1000 characters)',
        });
    }

    let maxTracks = TRACK_LIMIT;
    let result;

    if (trackCount > TRACK_LIMIT) {
        throw createError({
            statusCode: 403,
            message: `You can only create playlists with up to ${TRACK_LIMIT} tracks.`,
        });
    }

    // Get client IP address for rate limiting
    const clientIP = getRequestIP(event, { xForwardedFor: true }) || 'unknown';

    // Check rate limit: 3 playlists per hour per IP
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

    result = await makeLLMRequest(description, trackCount, model);

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

    batchResults = batchResults.filter((track) => track.id !== null);

    if (batchResults.length > trackCount) {
        batchResults = batchResults.slice(0, trackCount);
    }

    // Save playlist to database
    const sql = useDatabase();
    const [savedPlaylist] = await sql`
        INSERT INTO playlists (description, title, tracks)
        VALUES (${description}, ${result.playlistTitle || 'Untitled Playlist'}, ${JSON.stringify(batchResults)})
        RETURNING id
    `;

    return {
        success: true,
        data: batchResults,
        playlistTitle: result.playlistTitle || '',
        playlistId: savedPlaylist.id,
    };
});
