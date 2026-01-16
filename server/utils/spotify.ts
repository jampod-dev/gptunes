// Token refresh callback type
type TokenRefreshCallback = (newToken: string) => void;

// Cache for service account token
let serviceTokenCache: { token: string; expiresAt: number } | null = null;

// Get a Spotify token using client credentials flow (for service account)
export async function getServiceSpotifyToken(): Promise<string> {
    // Check if we have a valid cached token
    if (serviceTokenCache && serviceTokenCache.expiresAt > Date.now()) {
        return serviceTokenCache.token;
    }

    const clientId = process.env.NUXT_SPOTIFY_SERVICE_CLIENT_ID;
    const clientSecret = process.env.NUXT_SPOTIFY_SERVICE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error(
            'Spotify service credentials not configured. Please set NUXT_SPOTIFY_SERVICE_CLIENT_ID and NUXT_SPOTIFY_SERVICE_CLIENT_SECRET in your .env file'
        );
    }

    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        },
        body: new URLSearchParams({
            grant_type: 'client_credentials',
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to get Spotify service token');
    }

    const data = await response.json();

    // Cache the token (expires_in is in seconds, we subtract 5 minutes for safety)
    serviceTokenCache = {
        token: data.access_token,
        expiresAt: Date.now() + (data.expires_in - 300) * 1000,
    };

    return data.access_token;
}

interface SpotifyFetchOptions {
    token: string;
    refreshToken: string;
    onTokenRefresh?: TokenRefreshCallback;
}

// Refresh the Spotify access token using the refresh token
export async function refreshSpotifyToken(refreshToken: string): Promise<string> {
    const clientId = process.env.NUXT_OAUTH_SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.NUXT_OAUTH_SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error('Spotify client credentials not configured');
    }

    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to refresh Spotify access token');
    }

    const data = await response.json();
    return data.access_token;
}

// Wrapper for Spotify API calls that handles token refresh on 401
async function spotifyFetch(
    url: string,
    options: RequestInit,
    tokenOptions: SpotifyFetchOptions
): Promise<Response> {
    let response = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            Authorization: `Bearer ${tokenOptions.token}`,
        },
    });

    // If unauthorized, try refreshing the token and retry
    if (response.status === 401 && tokenOptions.refreshToken) {
        const newToken = await refreshSpotifyToken(tokenOptions.refreshToken);

        // Notify caller of the new token so they can update the session
        if (tokenOptions.onTokenRefresh) {
            tokenOptions.onTokenRefresh(newToken);
        }

        // Retry with new token
        response = await fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                Authorization: `Bearer ${newToken}`,
            },
        });
    }

    return response;
}

export async function batchSearchSpotifyTracks({
    token,
    tracks,
    refreshToken,
    onTokenRefresh,
}: {
    token: string;
    tracks: any[];
    refreshToken?: string;
    onTokenRefresh?: TokenRefreshCallback;
}) {
    const batchSize = 10; // Spotify API limit for batch requests
    const results = [...tracks];
    let currentToken = token;

    for (const track of results) {
        const query = `${track.title} artist: ${track.artist}`;

        const tokenOptions: SpotifyFetchOptions = {
            token: currentToken,
            refreshToken: refreshToken || '',
            onTokenRefresh: (newToken) => {
                currentToken = newToken;
                if (onTokenRefresh) onTokenRefresh(newToken);
            },
        };

        const response = await spotifyFetch(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track`,
            { method: 'GET' },
            tokenOptions
        );

        if (!response.ok) {
            throw new Error(`Spotify API error: ${response.statusText}`);
        }

        const data = await response.json();
        try {
            const spotifyTrack = data.tracks.items[0];
            if (!spotifyTrack) {
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

            if (spotifyTrack.artists.length > 0) {
                track.artist = spotifyTrack.artists[0].name;
            }
            track.title = spotifyTrack.name;
            track.reason = track.reason;
            track.id = spotifyTrack.id || null;
            track.cover = spotifyTrack.album.images[0]?.url || null; // Get the first image URL
            track.uri = spotifyTrack.uri || null; // Get the track
            track.externalUrl = spotifyTrack.external_urls.spotify || null; // Get the external URL
            track.previewUrl = spotifyTrack.preview_url || null; // Get
        } catch (e: any) {
            // Track not found on Spotify, keep generic values
        }
    }

    return results;
}

export async function createSpotifyPlaylist({ token, userId, name, trackURIs }) {
    try {
        // Step 1: Create the playlist

        const playlistResponse = await fetch(
            `https://api.spotify.com/v1/users/${userId}/playlists`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name,
                    public: false, // Set to true if you want the playlist to be public
                }),
            }
        );

        if (!playlistResponse.ok) {
            throw new Error(`Failed to create playlist: ${playlistResponse.statusText}`);
        }

        const playlist = await playlistResponse.json();

        // Step 2: Add tracks to the playlist if provided
        if (trackURIs.length > 0) {
            // Spotify API allows max 100 tracks per request
            const batchSize = 100;
            for (let i = 0; i < trackURIs.length; i += batchSize) {
                const batch = trackURIs.slice(i, i + batchSize);
                await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ uris: batch }),
                });
            }
        }

        return {
            success: true,
            playlist: {
                id: playlist.id,
                name: playlist.name,
                external_urls: playlist.external_urls,
                public: playlist.public,
                tracks: playlist.tracks,
            },
        };
    } catch (error) {
        throw new Error(
            `Failed to create playlist: ${error.response?.data?.error?.message || error.message}`
        );
    }
}

export async function updateSpotifyPlaylist({
    token,
    playlistId,
    name,
    trackURIs,
    refreshToken,
    onTokenRefresh,
}: {
    token: string;
    playlistId: string;
    name?: string;
    trackURIs: string[];
    refreshToken?: string;
    onTokenRefresh?: (newToken: string) => void;
}) {
    try {
        let currentToken = token;

        const tokenOptions: SpotifyFetchOptions = {
            token: currentToken,
            refreshToken: refreshToken || '',
            onTokenRefresh: (newToken) => {
                currentToken = newToken;
                if (onTokenRefresh) onTokenRefresh(newToken);
            },
        };

        // Update playlist name if provided
        if (name) {
            await spotifyFetch(
                `https://api.spotify.com/v1/playlists/${playlistId}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name }),
                },
                tokenOptions
            );
        }

        // Replace all tracks in the playlist
        // First, clear the playlist by replacing with empty array
        const replaceResponse = await spotifyFetch(
            `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
            {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uris: trackURIs.slice(0, 100) }), // First 100 tracks
            },
            tokenOptions
        );

        if (!replaceResponse.ok) {
            throw new Error('Failed to update playlist tracks');
        }

        // If more than 100 tracks, add the rest in batches
        if (trackURIs.length > 100) {
            const batchSize = 100;
            for (let i = 100; i < trackURIs.length; i += batchSize) {
                const batch = trackURIs.slice(i, i + batchSize);
                await spotifyFetch(
                    `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ uris: batch }),
                    },
                    tokenOptions
                );
            }
        }

        return {
            success: true,
            message: `Playlist updated with ${trackURIs.length} tracks`,
        };
    } catch (error: any) {
        throw new Error(`Failed to update playlist: ${error.message}`);
    }
}
