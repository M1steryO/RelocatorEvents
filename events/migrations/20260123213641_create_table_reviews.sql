-- +goose Up
-- +goose StatementBegin
create table reviews
(
    id            bigserial primary key,
    event_id      bigint       not null references events (id) on delete cascade,
    author_id     bigint       not null,
    grade         int          not null,
    advantages    varchar(255)          default '-',
    disadvantages varchar(255)          default '-',
    text          varchar(255) not null,
    created_at    timestamptz  not null default now()


);

create type media_type AS enum ('image', 'video', 'unknown');

create table reviews_media
(
    id          bigserial primary key,
    review_id   bigint       not null references reviews (id) on delete cascade,

    storage_key varchar(255) not null,
    media_type  media_type   not null,
    created_at  timestamptz  not null default now(),

    unique (review_id, storage_key)
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
drop table reviews_media;
drop type media_type;
drop table reviews;
-- +goose StatementEnd
