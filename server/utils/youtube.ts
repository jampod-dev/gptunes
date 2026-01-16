import YTMusic from 'ytmusic-api';

// Cached YTMusic instance
let ytmusicInstance: YTMusic | null = null;

/**
 * Initialize and cache the YTMusic API instance.
 * The library requires initialization before making requests.
 */
export async function getYTMusicInstance(): Promise<YTMusic> {
    if (ytmusicInstance) {
        return ytmusicInstance;
    }

    ytmusicInstance = new YTMusic();
    await ytmusicInstance.initialize();

    return ytmusicInstance;
}

/**
 * Search for tracks on YouTube Music and enrich the track data.
 * Equivalent to batchSearchSpotifyTracks but using ytmusic-api.
 */
export async function batchSearchYouTubeTracks({
    tracks,
}: {
    tracks: any[];
}) {
    const ytmusic = await getYTMusicInstance();
    const results = [...tracks];

    for (const track of results) {
        const query = `${track.title} ${track.artist}`;

        try {
            const searchResults = await ytmusic.searchSongs(query);

            if (!searchResults || searchResults.length === 0) {
                track.artist = 'Unknown';
                track.title = 'Unknown';
                track.reason = 'Track not found';
                track.id = null;
                track.cover = null;
                track.uri = null;
                track.externalUrl = null;
                track.previewUrl = null;
                continue;
            }

            const ytTrack = searchResults[0];

            let coverUrl = null;

            if (ytTrack.videoId) {
                coverUrl = `https://i.ytimg.com/vi/${ytTrack.videoId}/hqdefault.jpg`;
            }

            // Update track with YouTube Music data
            track.artist = ytTrack.artist?.name || track.artist;
            track.title = ytTrack.name || track.title;
            track.reason = track.reason;
            track.id = ytTrack.videoId || null;
            track.cover = coverUrl;
            track.uri = ytTrack.videoId ? `https://music.youtube.com/watch?v=${ytTrack.videoId}` : null;
            track.externalUrl = ytTrack.videoId ? `https://music.youtube.com/watch?v=${ytTrack.videoId}` : null;
            track.previewUrl = null; // YouTube Music doesn't provide preview URLs via this API
        } catch (e: any) {
            // Track not found on YouTube Music, keep generic values
            console.error(`Error searching for track "${query}":`, e.message);
        }
    }

    return results;
}



/**
 * Get details of a song from YouTube Music.
 */
export async function getYouTubeSong(videoId: string) {
    const ytmusic = await getYTMusicInstance();
    return await ytmusic.getSong(videoId);
}

/**
 * Get details of a playlist from YouTube Music.
 */
export async function getYouTubePlaylist(playlistId: string) {
    const ytmusic = await getYTMusicInstance();
    return await ytmusic.getPlaylist(playlistId);
}

/**
 * Get videos from a YouTube Music playlist.
 */
export async function getYouTubePlaylistVideos(playlistId: string) {
    const ytmusic = await getYTMusicInstance();
    return await ytmusic.getPlaylistVideos(playlistId);
}

/**
 * Search for songs on YouTube Music.
 */
export async function searchYouTubeSongs(query: string) {
    const ytmusic = await getYTMusicInstance();
    return await ytmusic.searchSongs(query);
}

/**
 * Search for artists on YouTube Music.
 */
export async function searchYouTubeArtists(query: string) {
    const ytmusic = await getYTMusicInstance();
    return await ytmusic.searchArtists(query);
}

/**
 * Search for albums on YouTube Music.
 */
export async function searchYouTubeAlbums(query: string) {
    const ytmusic = await getYTMusicInstance();
    return await ytmusic.searchAlbums(query);
}

/**
 * Get artist details from YouTube Music.
 */
export async function getYouTubeArtist(artistId: string) {
    const ytmusic = await getYTMusicInstance();
    return await ytmusic.getArtist(artistId);
}

/**
 * Get album details from YouTube Music.
 */
export async function getYouTubeAlbum(albumId: string) {
    const ytmusic = await getYTMusicInstance();
    return await ytmusic.getAlbum(albumId);
}

/**
 * Get lyrics for a song from YouTube Music.
 */
export async function getYouTubeLyrics(videoId: string) {
    const ytmusic = await getYTMusicInstance();
    return await ytmusic.getLyrics(videoId);
}
