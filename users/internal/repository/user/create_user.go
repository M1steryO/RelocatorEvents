package user

import (
	"context"
	"errors"
	modelDomain "github.com/M1steryO/RelocatorEvents/users/internal/models/user"
	"github.com/M1steryO/platform_common/pkg/db"
	"github.com/jackc/pgconn"
)

func (s *repo) Create(ctx context.Context, user *modelDomain.User) (int64, error) {
	var lastInsertId int64
	q := db.Query{
		Title: "user_repository.Create",
		Query: `INSERT INTO "users" (name, telegram_id, email, password) 
				VALUES ($1, $2, $3, $4) 
			 	RETURNING id;`,
	}
	err := s.db.DB().QueryRowContext(ctx, q,
		user.Info.Name, user.Info.TelegramID, user.Info.Email, user.Password).Scan(&lastInsertId)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) {
			if pgErr.Code == constraintErrorCode {
				return 0, modelDomain.ErrUserExists
			}
		}
		return 0, err
	}
	return lastInsertId, nil

}

func (s *repo) CreateUserData(ctx context.Context, userId int64, telegramUsername string, userInfo *modelDomain.UserInfo) error {
	q := db.Query{
		Title: "user_repository.CreateUserData",
		Query: `INSERT INTO "user_data" (user_id,tg_username, country, city, language)
				VALUES ($1, $2, $3, $4, $5)`,
	}

	_, err := s.db.DB().ExecContext(ctx, q, userId, telegramUsername, userInfo.Country, userInfo.City, userInfo.Language)
	if err != nil {
		return err
	}
	return nil
}

func (s *repo) CreateUserInterests(ctx context.Context, userId int64, interestsIds []int64) error {
	q := db.Query{
		Title: "user_repository.CreateUserInterests",
		Query: `INSERT INTO user_interests (user_id, interest_id)
		SELECT $1, unnest($2::bigint[])
		ON CONFLICT DO NOTHING`,
	}

	_, err := s.db.DB().ExecContext(ctx, q, userId, interestsIds)
	if err != nil {
		return err
	}
	return nil
}
