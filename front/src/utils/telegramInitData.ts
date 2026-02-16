const TELEGRAM_INIT_DATA_HEADER = 'X-Telegram-Init-Data';

export const getTelegramInitData = (): string => {
    if (typeof window === 'undefined') {
        return '';
    }

    const tg = window.Telegram?.WebApp;
    return tg?.initData || '';
};

export const addTelegramInitDataHeader = (headers: Record<string, string>) => {
    const initData = getTelegramInitData();
    if (initData) {
        headers[TELEGRAM_INIT_DATA_HEADER] = initData;
    }
};
