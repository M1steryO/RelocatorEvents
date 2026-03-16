/**
 * App config. Values from environment variables (Vite: import.meta.env.VITE_*).
 */

const getEnv = (key: string, fallback: string): string => {
    if (typeof import.meta.env === 'undefined') return fallback;
    const value = import.meta.env[key];
    return typeof value === 'string' && value.trim() !== '' ? value.trim() : fallback;
};

/** Base URL of the main API (auth, events, reviews). */
// export const API_BASE_URL = getEnv('VITE_API_BASE_URL', 'http://158.160.78.14:50043');

// // /** Base URL for media files (review images/videos). */
// export const MEDIA_BASE_URL = getEnv('VITE_MEDIA_BASE_URL', 'http://158.160.78.14:9000/media');

// export const API_BASE_URL = getEnv('VITE_API_BASE_URL', 'http://localhost:50043');

// // /** Base URL for media files (review images/videos). */
// export const MEDIA_BASE_URL = getEnv('VITE_MEDIA_BASE_URL', 'http://localhost:9000/media');