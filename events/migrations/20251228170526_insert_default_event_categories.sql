-- +goose Up
-- +goose StatementBegin
INSERT INTO categories (code, title)
VALUES ('painting', 'Живопись'),
       ('theatre', 'Театр'),
       ('art', 'Искусство'),
       ('languages', 'Изучение языков'),
       ('music', 'Музыка'),
       ('astrology', 'Астрология'),
       ('dance', 'Танцы'),
       ('history', 'История'),
       ('volunteering', 'Волонтёрство'),
       ('parties', 'Вечеринки'),
       ('psychology', 'Психология'),
       ('fashion', 'Мода и стиль'),
       ('education', 'Образование'),
       ('it', 'IT-технологии'),
       ('design', 'Дизайн'),
       ('cooking', 'Кулинария'),
       ('business', 'Бизнес'),
       ('nature', 'Природа'),
       ('sport', 'Спорт'),
       ('quizzes', 'Квизы'),
       ('culture_clubs', 'Культурные клубы'),
       ('cinema', 'Кино'),
       ('theater', 'Театр'),
       ('festivals', 'Фестивали'),
       ('gastronomic', 'Гастрономия'),
       ('cafe', 'Кафе'),
       ('exhibition', 'Выставки'),
       ('kids', 'Дети'),
       ('nightlife', 'Ночная жизнь'),
       ('sports', 'Спорт'),
       ('movies', 'Кино'),
       ('excursions', 'Экскурсии'),
       ('english_language', 'На английском'),
       ('native_language', 'На родном языке');
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
TRUNCATE TABLE categories RESTART IDENTITY CASCADE;
-- +goose StatementEnd
