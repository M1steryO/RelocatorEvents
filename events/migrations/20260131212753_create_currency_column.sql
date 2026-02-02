-- +goose Up
-- +goose StatementBegin
alter table events
    add column currency varchar(3) default 'USD';
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
alter table events
    drop column currency;
-- +goose StatementEnd
