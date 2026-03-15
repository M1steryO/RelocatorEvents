package user

import (
	"context"
	modelRepo "github.com/M1steryO/RelocatorEvents/auth/internal/repository/user/model"
	"github.com/M1steryO/platform_common/pkg/db"
	"github.com/lib/pq"
)

func (s *repo) GetInterestsByCodes(ctx context.Context, interestsCodes []string) ([]int64, error) {
	q := db.Query{
		Title: "user_repository.CreateUserInterests",
		Query: `SELECT id, code FROM "interests" WHERE code = Any($1)`,
	}

	rows, err := s.db.DB().QueryContext(ctx, q, pq.Array(interestsCodes))
	defer rows.Close()

	if err != nil {
		return nil, err
	}

	data := make([]int64, 0, len(interestsCodes))
	for rows.Next() {
		var i modelRepo.UserInterest
		if err := rows.Scan(&i.Id, &i.Code); err != nil {
			return nil, err
		}
		data = append(data, i.Id)
	}

	return data, nil
}
