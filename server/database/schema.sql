-- GPTunes Database Schema

-- Playlists table
CREATE TABLE IF NOT EXISTS playlists (
    id SERIAL PRIMARY KEY,
    description TEXT NOT NULL,
    title TEXT,
    tracks JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Refinements table
CREATE TABLE IF NOT EXISTS refinements (
    id SERIAL PRIMARY KEY,
    playlist_id INTEGER NOT NULL,
    description TEXT NOT NULL,
    title TEXT,
    tracks JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_playlists_created_at ON playlists(created_at);
CREATE INDEX IF NOT EXISTS idx_refinements_playlist_id ON refinements(playlist_id);
CREATE INDEX IF NOT EXISTS idx_refinements_created_at ON refinements(created_at);
