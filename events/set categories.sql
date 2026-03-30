INSERT INTO categories (code, title)
VALUES ('theater', 'Театр'),
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


WITH target_categories AS (
    SELECT id, code
    FROM categories
    WHERE code IN (
                   'excursions',
                   'kids_activities',
                   'english_language',
                   'native_language'
        )
),
     random_events_per_category AS (
         SELECT
             c.id AS category_id,
             e.id AS event_id
         FROM target_categories c
                  CROSS JOIN LATERAL (
             SELECT id
             FROM events
             ORDER BY random()
             LIMIT 10
             ) e
     )
INSERT INTO event_categories (event_id, category_id)
SELECT event_id, category_id
FROM random_events_per_category
ON CONFLICT DO NOTHING;