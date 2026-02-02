-- +goose Up
-- +goose StatementBegin
create table interests
(
    id    bigserial primary key,
    code  varchar(255) not null unique,
    title varchar(255) not null
);

create table user_interests
(
    user_id     bigint not null references users (id) on delete cascade,
    interest_id bigint not null references interests (id) on delete cascade,
    primary key (user_id, interest_id)
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
drop table user_interests;
drop table interests;
-- +goose StatementEnd
