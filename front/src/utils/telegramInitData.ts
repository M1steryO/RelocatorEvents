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

    const userAgent = window.navigator.userAgent.toLowerCase();
    const hasTelegramWebViewUserAgent =
        userAgent.includes('telegram') || userAgent.includes('tgwebview');

    const hasUserInInitData = Boolean(tg.initDataUnsafe?.user?.id);
    const initData = tg.initData || '';
    const hasSignedInitData =
        initData.trim().length > 0 &&
        initData.includes('hash=') &&
        initData.includes('auth_date=');

    // In regular browser window.Telegram can be present, so we require
    // actual mini-app signals (Telegram UA + signed initData or resolved user).
    return hasTelegramWebViewUserAgent && (hasUserInInitData || hasSignedInitData);
};

export const addTelegramInitDataHeader = (headers: Record<string, string>) => {
    const initData = getTelegramInitData();
    if (initData) {
        headers[TELEGRAM_INIT_DATA_HEADER] = initData;
    }
};
