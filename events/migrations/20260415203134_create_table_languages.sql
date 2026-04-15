-- +goose Up
-- +goose StatementBegin
alter table events
    add column languages text[] check (
        languages <@ array['ru', 'en', 'ge']
        );
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
alter table events
    drop column languages
-- +goose StatementEnd
