-- +goose Up
-- +goose StatementBegin
alter table events
    drop column rating,
    add column rating numeric(3, 1);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
alter table events
    drop column rating,
    add column rating numeric(3, 2);
-- +goose StatementEnd
