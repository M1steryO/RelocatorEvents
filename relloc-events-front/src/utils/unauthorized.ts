const UNAUTHORIZED_EVENT = 'unauthorized';

export const notifyUnauthorized = () => {
    if (typeof window === 'undefined') {
        return;
    }

    window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
};

export const subscribeToUnauthorized = (handler: () => void) => {
    if (typeof window === 'undefined') {
        return () => {};
    }

    const listener = () => handler();
    window.addEventListener(UNAUTHORIZED_EVENT, listener);

    return () => window.removeEventListener(UNAUTHORIZED_EVENT, listener);
};
