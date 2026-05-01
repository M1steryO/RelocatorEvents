-- +goose Up
-- +goose StatementBegin
alter table user_data
    add column avatar_url text;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
alter table user_data
    drop column avatar_url;
-- +goose StatementEnd