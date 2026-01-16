// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2025-05-15',
    devtools: { enabled: true },
    modules: ['@nuxt/scripts', '@nuxt/fonts', 'nuxt-auth-utils', 'nuxt-toast'],
    app: {
        head: {
            htmlAttrs: {
                lang: 'en',
            },
            title: 'GPTunes - AI-Powered Playlist Generation',
            meta: [
                {
                    name: 'viewport',
                    content:
                        'width=device-width, initial-scale=1, interactive-widget=resizes-content',
                },
                {
                    name: 'description',
                    content:
                        "Transform natural language descriptions into curated Spotify playlists using Google's Gemini AI. Simply describe the vibe you're looking for, and GPTunes creates a personalized playlist in seconds.",
                },
                {
                    name: 'keywords',
                    content:
                        'AI playlist, Spotify playlist generator, music AI, Google Gemini, playlist creation, music curation, AI music',
                },
                { name: 'author', content: 'GPTunes' },

                // Open Graph / Facebook
                { property: 'og:type', content: 'website' },
                { property: 'og:url', content: 'https://www.gptunes.app' },
                { property: 'og:title', content: 'GPTunes - AI-Powered Playlist Generation' },
                {
                    property: 'og:description',
                    content:
                        "Transform natural language descriptions into curated Spotify playlists using Google's Gemini AI. Describe any vibe, mood, or style and get a personalized playlist in seconds.",
                },
                { property: 'og:image', content: 'https://www.gptunes.app/og-image.png' },
                { property: 'og:image:width', content: '1200' },
                { property: 'og:image:height', content: '630' },
                { property: 'og:site_name', content: 'GPTunes' },

                // Twitter
                { name: 'twitter:card', content: 'summary_large_image' },
                { name: 'twitter:url', content: 'https://www.gptunes.app' },
                { name: 'twitter:title', content: 'GPTunes - AI-Powered Playlist Generation' },
                {
                    name: 'twitter:description',
                    content:
                        "Transform natural language descriptions into curated Spotify playlists using Google's Gemini AI. Describe any vibe, mood, or style and get a personalized playlist in seconds.",
                },
                { name: 'twitter:image', content: 'https://www.gptunes.app/og-image.png' },

                // Additional meta tags
                { name: 'theme-color', content: '#667eea' },
                { name: 'apple-mobile-web-app-capable', content: 'yes' },
                { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
            ],
        },
    },
    nitro: {
        preset: 'vercel',
    },
    devServer: {
        host: '0.0.0.0',
    },
    runtimeConfig: {
        oauth: {
            // provider in lowercase (github, google, etc.)
            spotify: {
                clientId: process.env.NUXT_OAUTH_SPOTIFY_CLIENT_ID,
                clientSecret: process.env.NUXT_OAUTH_SPOTIFY_CLIENT_SECRET,
                scope: ['playlist-modify-private'],
            },
        },
    },
});
