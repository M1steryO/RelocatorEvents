// Маппинг интересов: код -> название
export const INTERESTS_MAP: Record<string, string> = {
    music: 'Музыка',
    theater: 'Театр',
    festivals: 'Фестивали',
    gastronomic: 'Гастрономия',
    cafe: 'Кафе',
    exhibition: 'Выставки',
    kids: 'Дети',
    education: 'Образование',
    nightlife: 'Ночная жизнь',
    sports: 'Спорт',
    movies: 'Кино',
};

// Массив кодов интересов для удобного использования
export const INTEREST_CODES = Object.keys(INTERESTS_MAP);

// Массив объектов с кодом и названием для отображения
export const INTERESTS_LIST = INTEREST_CODES.map(code => ({
    code,
    label: INTERESTS_MAP[code],
}));

// Функция для получения названия по коду
export const getInterestLabel = (code: string): string => {
    return INTERESTS_MAP[code] || code;
};

// Функция для получения кода по названию (обратный поиск)
export const getInterestCode = (label: string): string | undefined => {
    return Object.keys(INTERESTS_MAP).find(
        code => INTERESTS_MAP[code] === label
    );
};


