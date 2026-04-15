-- +goose Up
-- +goose StatementBegin
alter table user_data
    add column language varchar(50) check (language in ('ru', 'en', 'ge')) not null default 'ru';
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
alter table user_data
    drop column language;
-- +goose StatementEnd
