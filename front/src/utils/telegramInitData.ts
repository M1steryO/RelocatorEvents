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
    const hasInitData = Boolean(tg.initData && tg.initData.trim().length > 0);
    const hasKnownPlatform = Boolean(tg.platform && tg.platform !== 'unknown');

    // In regular web the Telegram object can exist, but without valid mini-app context.
    return hasUserInInitData || (hasKnownPlatform && hasInitData);
};

export const addTelegramInitDataHeader = (headers: Record<string, string>) => {
    const initData = getTelegramInitData();
    if (initData) {
        headers[TELEGRAM_INIT_DATA_HEADER] = initData;
    }
};
