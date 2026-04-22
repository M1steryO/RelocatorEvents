const TELEGRAM_INIT_DATA_HEADER = 'X-Telegram-Init-Data';

export const getTelegramInitData = (): string => {
    if (typeof window === 'undefined') {
        return '';
    }

    const tg = window.Telegram?.WebApp;
    return tg?.initData || '';
};

export const isTelegramMiniApp = (): boolean => {
    if (typeof window === 'undefined') {
        return false;
    }

    const tg = window.Telegram?.WebApp;
    if (!tg) {
        return false;
    }

    const hasUserInInitData = Boolean(tg.initDataUnsafe?.user?.id);
    const initData = tg.initData || '';
    const hasSignedInitData =
        initData.trim().length > 0 &&
        initData.includes('hash=') &&
        initData.includes('auth_date=');

    // A real mini-app session always has signed initData or resolved Telegram user.
    // This is enough and does not depend on inconsistent WebView user-agent strings.
    return hasUserInInitData || hasSignedInitData;
};

export const addTelegramInitDataHeader = (headers: Record<string, string>) => {
    const initData = getTelegramInitData();
    if (initData) {
        headers[TELEGRAM_INIT_DATA_HEADER] = initData;
    }
};
