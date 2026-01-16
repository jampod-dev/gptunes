// Simple in-memory rate limiter for IP addresses
// For production, consider using Redis or a database

interface RateLimitEntry {
    timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitEntry>();

function cleanupIfNeeded(windowMs: number) {
    // Only cleanup when we have more than 1000 entries to avoid overhead
    if (rateLimitStore.size > 1000) {
        const now = Date.now();
        for (const [ip, entry] of rateLimitStore.entries()) {
            entry.timestamps = entry.timestamps.filter((ts) => now - ts < windowMs);
            if (entry.timestamps.length === 0) {
                rateLimitStore.delete(ip);
            }
        }
    }
}

const MAX_REQUESTS = 20;

export function checkRateLimit(ip: string, windowMs: number = 60 * 60 * 1000): boolean {
    // Perform lazy cleanup
    cleanupIfNeeded(windowMs);
    const now = Date.now();
    let entry = rateLimitStore.get(ip);
    if (!entry) {
        entry = { timestamps: [] };
        rateLimitStore.set(ip, entry);
    }

    // Remove timestamps outside the current window
    entry.timestamps = entry.timestamps.filter((ts) => now - ts < windowMs);

    // Check if limit is exceeded
    if (entry.timestamps.length >= MAX_REQUESTS) {
        return false;
    }

    // Add current request timestamp
    entry.timestamps.push(now);

    return true;
}

export function getRemainingRequests(ip: string, windowMs: number = 60 * 60 * 1000): number {
    const now = Date.now();
    const entry = rateLimitStore.get(ip);

    if (!entry) {
        return MAX_REQUESTS;
    }

    // Count requests within the window
    const recentRequests = entry.timestamps.filter((ts) => now - ts < windowMs).length;
    return Math.max(0, MAX_REQUESTS - recentRequests);
}

export function getResetTime(ip: string, windowMs: number = 60 * 60 * 1000): number | null {
    const entry = rateLimitStore.get(ip);
    if (!entry || entry.timestamps.length === 0) {
        return null;
    }

    const oldestTimestamp = Math.min(...entry.timestamps);
    return oldestTimestamp + windowMs;
}
