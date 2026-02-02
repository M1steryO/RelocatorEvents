-- +goose Up
-- +goose StatementBegin
alter table events
    alter column reviews_count set not null,
    alter column reviews_count set default 0;

alter table events
    alter column rating type numeric(4, 2),
    alter column rating set default 0;

alter table events
    alter column rating_sum set not null,
    alter column rating_sum set default 0;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
alter table events
    alter column reviews_count drop not null,
    alter column reviews_count drop default;

alter table events
    alter column rating type numeric(3, 2),
    alter column rating drop default;

alter table events
    alter column rating_sum drop not null,
    alter column rating_sum drop default;
-- +goose StatementEnd
