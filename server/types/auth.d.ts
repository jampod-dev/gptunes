// Extend the User type from nuxt-auth-utils to include Spotify tokens
declare module '#auth-utils' {
    interface User {
        spotify_id: string;
        access_token: string;
        refresh_token: string;
        plan: string;
    }
}

export { }
