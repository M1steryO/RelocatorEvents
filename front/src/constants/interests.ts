/**
 * Полный справочник кодов категорий/интересов (как в API) → русская подпись в UI.
 * Ключи в нижнем регистре для устойчивого поиска.
 */
export const CATEGORY_CODE_LABELS: Record<string, string> = {
    painting: 'Живопись',
    theatre: 'Театр',
    art: 'Искусство',
    languages: 'Изучение языков',
    music: 'Музыка',
    astrology: 'Астрология',
    dance: 'Танцы',
    history: 'История',
    volunteering: 'Волонтёрство',
    parties: 'Вечеринки',
    psychology: 'Психология',
    fashion: 'Мода и стиль',
    education: 'Образование',
    it: 'IT-технологии',
    design: 'Дизайн',
    cooking: 'Кулинария',
    business: 'Бизнес',
    nature: 'Природа',
    sport: 'Спорт',
    quizzes: 'Квизы',
    culture_clubs: 'Культурные клубы',
    cinema: 'Кино',
    theater: 'Театр',
    festivals: 'Фестивали',
    gastronomic: 'Гастрономия',
    cafe: 'Кафе',
    exhibition: 'Выставки',
    kids: 'Дети',
    nightlife: 'Ночная жизнь',
    sports: 'Спорт',
    movies: 'Кино',
    excursions: 'Экскурсии',
    kids_activities: 'Детям',
    english_language: 'На английском',
    native_language: 'На родном языке',
};

// Маппинг интересов для формы регистрации (подмножество кодов)
export const INTERESTS_MAP: Record<string, string> = {
    music: CATEGORY_CODE_LABELS.music,
    theater: CATEGORY_CODE_LABELS.theater,
    festivals: CATEGORY_CODE_LABELS.festivals,
    gastronomic: CATEGORY_CODE_LABELS.gastronomic,
    cafe: CATEGORY_CODE_LABELS.cafe,
    exhibition: CATEGORY_CODE_LABELS.exhibition,
    kids: CATEGORY_CODE_LABELS.kids,
    education: CATEGORY_CODE_LABELS.education,
    nightlife: CATEGORY_CODE_LABELS.nightlife,
    sports: CATEGORY_CODE_LABELS.sports,
    movies: CATEGORY_CODE_LABELS.movies,
};

// Массив кодов интересов для удобного использования
export const INTEREST_CODES = Object.keys(INTERESTS_MAP);

// Массив объектов с кодом и названием для отображения
export const INTERESTS_LIST = INTEREST_CODES.map((code) => ({
    code,
    label: INTERESTS_MAP[code],
}));

// Функция для получения названия по коду
export const getInterestLabel = (code: string): string => {
    const raw = code.trim();
    if (!raw) {
        return raw;
    }
    const lower = raw.toLowerCase();

    const fromApiTable = CATEGORY_CODE_LABELS[lower];
    if (fromApiTable) {
        return fromApiTable;
    }

    const fromCanonical = INTERESTS_MAP[raw] ?? INTERESTS_MAP[lower];
    if (fromCanonical) {
        return fromCanonical;
    }

    const ciKey = Object.keys(INTERESTS_MAP).find((k) => k.toLowerCase() === lower);
    if (ciKey) {
        return INTERESTS_MAP[ciKey];
    }

    return raw;
};

// Функция для получения кода по названию (обратный поиск)
export const getInterestCode = (label: string): string | undefined => {
    return Object.keys(INTERESTS_MAP).find((code) => INTERESTS_MAP[code] === label);
};

