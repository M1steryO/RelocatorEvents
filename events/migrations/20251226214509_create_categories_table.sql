-- +goose Up
-- +goose StatementBegin
create table categories
(
    id         bigserial primary key,
    code       varchar(255) unique       not null,
    title      varchar(255)              not null,

    created_at timestamptz default now() not null,
    updated_at timestamptz
);

create table event_categories
(
    event_id    bigint references events (id) on delete cascade      not null,
    category_id bigint references categories (id) on delete restrict not null,

    primary key (event_id, category_id)
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS event_categories;
DROP TABLE IF EXISTS categories;

-- +goose StatementEnd
