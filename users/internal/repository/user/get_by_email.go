package user

import (
	"context"
	"errors"
	modelDomain "github.com/M1steryO/RelocatorEvents/users/internal/models/user"
	"github.com/M1steryO/RelocatorEvents/users/internal/repository/user/converter"
	modelRepo "github.com/M1steryO/RelocatorEvents/users/internal/repository/user/model"
	"github.com/M1steryO/platform_common/pkg/db"
	"github.com/jackc/pgx/v4"
)

func (s *repo) GetByEmail(ctx context.Context, email string) (*modelDomain.User, error) {
	user := modelRepo.User{}
	q := db.Query{
		Title: "user_repository.GetByEmail",
		Query: `SELECT id, name,telegram_id,email,tg_username,country, city, password
				 FROM "users"
				 JOIN user_data ON users.id = user_data.user_id
				 
				 WHERE email=$1`,
	}
	err := s.db.DB().ScanOneContext(ctx, &user, q, email)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, modelDomain.ErrUserNotFound
		}
		return nil, err
	}
	return converter.ToUserFromRepo(&user), nil
}
