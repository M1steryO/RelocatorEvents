/**
 * В Mini App / WebView sessionStorage иногда недоступен (SecurityError, квоты, режим приватности).
 * Держим зеркало в памяти, чтобы лента и прочее не ломались.
 */
const memoryStore = new Map<string, string>();

export function safeSessionGetItem(key: string): string | null {
    try {
        if (typeof sessionStorage !== 'undefined') {
            const v = sessionStorage.getItem(key);
            if (v !== null) {
                memoryStore.set(key, v);
                return v;
            }
        }
    } catch {
        /* ignore */
    }
    return memoryStore.get(key) ?? null;
}

export function safeSessionSetItem(key: string, value: string): void {
    memoryStore.set(key, value);
    try {
        sessionStorage?.setItem(key, value);
    } catch {
        /* only memory */
    }
}

export function safeSessionRemoveItem(key: string): void {
    memoryStore.delete(key);
    try {
        sessionStorage?.removeItem(key);
    } catch {
        /* ignore */
    }
}
