-- +goose Up
-- +goose StatementBegin
alter table reviews
    add column author_name varchar(255);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
alter table reviews
    drop column author_name;
-- +goose StatementEnd
