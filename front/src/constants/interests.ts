// Маппинг интересов: код -> название
export const INTERESTS_MAP: Record<string, string> = {
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


