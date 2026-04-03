-- +goose Up
-- +goose StatementBegin
create table users
(
    id          bigserial primary key,
    telegram_id bigint unique,
    name        varchar(255) not null,
    email       varchar(255) unique,
    password    varchar(255) not null,
    created_at  timestamp    not null default now(),
    updated_at  timestamp

);

create table user_data
(
    user_id     bigint primary key,
    tg_username varchar(255),
    country     varchar(255),
    city        varchar(255),
    foreign key (user_id) references users (id) on delete cascade on update cascade
);



-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
drop table users cascade;
drop table user_data cascade;
-- +goose StatementEnd
