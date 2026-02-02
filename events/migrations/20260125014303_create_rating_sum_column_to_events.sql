-- +goose Up
-- +goose StatementBegin
alter table events
    add column rating_sum int default 0;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
alter table events
    drop column rating_sum;
-- +goose StatementEnd
