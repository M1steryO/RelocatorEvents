package reviews

import "github.com/M1steryO/platform_common/pkg/db"

type repo struct {
	db db.Client
}

func NewReviewsRepository(db db.Client) *repo {
	return &repo{
		db: db,
	}
}
