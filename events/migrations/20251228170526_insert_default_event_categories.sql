-- +goose Up
-- +goose StatementBegin
INSERT INTO categories (code, title) VALUES
                                         ('painting', 'Живопись'),
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
                                         ('cinema', 'Кино');
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
TRUNCATE TABLE categories RESTART IDENTITY CASCADE;
-- +goose StatementEnd
