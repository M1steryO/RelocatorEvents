const TELEGRAM_INIT_DATA_HEADER = 'X-Telegram-Init-Data';

export const getTelegramInitData = (): string => {
    const win = window as typeof window & { Telegram?: { WebApp?: any } };
   
    if (typeof window === 'undefined') {
        return '';
    }

    const tg = window.Telegram?.WebApp;
    return tg?.initData || 'query_id=AAEHJYgzAAAAAAcliDMVAvhm&user=%7B%22id%22%3A864560391%2C%22first_name%22%3A%22%D0%94%D0%BC%D0%B8%D1%82%D1%80%D0%B8%D0%B9%22%2C%22last_name%22%3A%22%22%2C%22username%22%3A%22m1stery18%22%2C%22language_code%22%3A%22ru%22%2C%22allows_write_to_pm%22%3Atrue%2C%22photo_url%22%3A%22https%3A%5C%2F%5C%2Ft.me%5C%2Fi%5C%2Fuserpic%5C%2F320%5C%2FbRmnTLHoqKbt9vBW5CaPpWlkzK0Ql-JX9-xGgVnOw3A.svg%22%7D&auth_date=1770065598&signature=C9zNUDjRhRL7IbsNdIs6I9l-Pghjh6FciZLy65E_7kPNmBmUp65xjKHJEosn6Y08c8b4XQQH4iWAjyUECeOkCA&hash=0e289e56e6d554c9bb4934d98a1c983b1a00c232d8109277f71e02d4e712f430';
};

export const addTelegramInitDataHeader = (headers: Record<string, string>) => {
    const initData = getTelegramInitData();
    if (initData) {
        headers[TELEGRAM_INIT_DATA_HEADER] = initData;
    }
};
