-- +goose Up
-- +goose StatementBegin
create table favourites
(
    id         bigserial primary key,
    user_id    bigint      not null,
    event_id   bigint      not null,
    created_at timestamptz not null default now(),

    unique (user_id, event_id)
);

create index idx_favourites_user_id on favourites (user_id);
-- +goose StatementEnd


-- +goose Down
-- +goose StatementBegin
drop table favourites;
-- +goose StatementEnd