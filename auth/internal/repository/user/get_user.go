package user

import (
	"context"
	"errors"
	modelDomain "github.com/M1steryO/RelocatorEvents/auth/internal/models/user"
	"github.com/M1steryO/RelocatorEvents/auth/internal/repository/user/converter"
	modelRepo "github.com/M1steryO/RelocatorEvents/auth/internal/repository/user/model"
	"github.com/M1steryO/platform_common/pkg/db"
	"github.com/jackc/pgx/v4"
)

func (s *repo) Get(ctx context.Context, id int64) (*modelDomain.User, error) {
	user := modelRepo.User{}
	q := db.Query{
		Title: "user_repository.Get",
		Query: `SELECT id, name,telegram_id,email,tg_username,country, city
				 FROM "users"
				 JOIN user_data ON users.id = user_data.user_id
				 
				 WHERE id=$1`,
	}
	err := s.db.DB().ScanOneContext(ctx, &user, q, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, modelDomain.ErrUserNotFound
		}
		return nil, err
	}
	q = db.Query{
		Title: "user_repository.Get.UserInterests",
		Query: `SELECT title, code
				 FROM "user_interests" ui
				 JOIN interests i ON i.id = ui.interest_id
				 WHERE user_id=$1`,
	}
	err = s.db.DB().ScanAllContext(ctx, &user.Info.Interests, q, id)

	return converter.ToUserFromRepo(&user), nil
}
