-- +goose Up
-- +goose StatementBegin
create type event_type AS enum ('online', 'offline');

CREATE TABLE event_address
(
    id           BIGSERIAL PRIMARY KEY,
    venue_name   VARCHAR(255),
    city         VARCHAR(100) NOT NULL,
    district     VARCHAR(100),
    postal_code  VARCHAR(20),
    country      VARCHAR(100) NOT NULL,
    full_address VARCHAR(512) NOT NULL,
    latitude     DECIMAL(10, 7),
    longitude    DECIMAL(10, 7),

    created_at   TIMESTAMP DEFAULT now()
);

create table events
(
    id              bigserial primary key,

    title           varchar(255)              not null,
    description     text,
    link            varchar(255)              not null unique,

    rating          numeric(3, 2),
    reviews_count   int,
    ratings_count   int,

    min_age         int,
    seats_available int,
    type            event_type                not null,

    address_id      int references event_address (id) on delete cascade,
    min_price       int,

    starts_at       timestamptz               not null,
    image_url       varchar(255),
    created_at      timestamptz default now() not null,
    updated_at      timestamptz


);

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS event_address;
DROP TYPE IF EXISTS event_type;
-- +goose StatementEnd
