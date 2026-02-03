package user

import (
	"context"
	"errors"
	modelDomain "github.com/M1steryO/RelocatorEvents/auth/internal/domain/user"
	"github.com/M1steryO/RelocatorEvents/auth/internal/repository"
	"github.com/M1steryO/RelocatorEvents/auth/internal/repository/user/converter"
	modelRepo "github.com/M1steryO/RelocatorEvents/auth/internal/repository/user/model"
	"github.com/M1steryO/platform_common/pkg/db"
	"github.com/jackc/pgconn"
	"github.com/jackc/pgx/v4"
	"github.com/lib/pq"
)

var (
	ErrUserNotFound = errors.New("user not found")
	ErrUserExists   = errors.New("user exists")
)

const constraintErrorCode = "23505"

type repo struct {
	db db.Client
}

func NewUserRepository(db db.Client) repository.UserRepository {
	return &repo{
		db: db,
	}
}

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
			return nil, ErrUserNotFound
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

func (s *repo) GetByTelegramId(ctx context.Context, telegramId int64) (*modelDomain.User, error) {
	user := modelRepo.User{}
	q := db.Query{
		Title: "user_repository.GetByTelegramId",
		Query: `SELECT id, name,telegram_id,email,tg_username,country, city
				 FROM "users"
				 JOIN user_data ON users.id = user_data.user_id
				 
				 WHERE telegram_id=$1`,
	}
	err := s.db.DB().ScanOneContext(ctx, &user, q, telegramId)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return converter.ToUserFromRepo(&user), nil
}

func (s *repo) Create(ctx context.Context, user *modelRepo.User) (int64, error) {
	var lastInsertId int64
	q := db.Query{
		Title: "user_repository.Create",
		Query: `INSERT INTO "users" (name, telegram_id, email, password) 
				VALUES ($1, $2, $3, $4) 
			 	RETURNING id;`,
	}

	err := s.db.DB().QueryRowContext(ctx, q,
		user.Info.Name, user.Info.TelegramId, user.Info.Email, user.Info.Name).Scan(&lastInsertId)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) {
			if pgErr.Code == constraintErrorCode {
				return 0, ErrUserExists
			}
		}
		return 0, err
	}
	return lastInsertId, nil

}

func (s *repo) CreateUserData(ctx context.Context, userId int64, telegramUsername string, userInfo *modelRepo.UserInfo) error {
	q := db.Query{
		Title: "user_repository.CreateUserData",
		Query: `INSERT INTO "user_data" (user_id,tg_username, country, city)
				VALUES ($1, $2, $3, $4)`,
	}

	_, err := s.db.DB().ExecContext(ctx, q, userId, telegramUsername, userInfo.Country, userInfo.City)
	if err != nil {
		return err
	}
	return nil
}

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
