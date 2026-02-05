const SERVICE_UNAVAILABLE_EVENT = 'service-unavailable';

export const notifyServiceUnavailable = () => {
    if (typeof window === 'undefined') {
        return;
    }

    window.dispatchEvent(new CustomEvent(SERVICE_UNAVAILABLE_EVENT));
};

export const subscribeToServiceUnavailable = (handler: () => void) => {
    if (typeof window === 'undefined') {
        return () => {};
    }

    const listener = () => handler();
    window.addEventListener(SERVICE_UNAVAILABLE_EVENT, listener);

    return () => window.removeEventListener(SERVICE_UNAVAILABLE_EVENT, listener);
};
