/** Безопасный внутренний путь из location.state (без open redirect). */
export function sanitizeInternalPath(from: unknown): string | null {
    if (typeof from !== 'string' || !from.startsWith('/') || from.startsWith('//')) {
        return null;
    }
    if (from.includes('..')) {
        return null;
    }
    return from;
}
