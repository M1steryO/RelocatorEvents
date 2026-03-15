package events

import (
	"github.com/M1steryO/platform_common/pkg/db"
)

const constraintErrorCode = "23505"

type repo struct {
	db db.Client
}

func NewEventRepository(db db.Client) *repo {
	return &repo{
		db: db,
	}
}
