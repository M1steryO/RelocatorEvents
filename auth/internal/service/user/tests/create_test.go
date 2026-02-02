package tests

import (
	"auth/internal/repository"
	"auth/internal/repository/mocks"
	modelRepo "auth/internal/repository/user/model"
	"auth/internal/service/user"
	"auth/internal/service/user/model"
	"context"
	"fmt"
	"github.com/M1steryO/platform_common/pkg/db"
	txMocks "github.com/M1steryO/platform_common/pkg/db/mocks"
	"github.com/brianvoe/gofakeit/v7"
	"github.com/gojuno/minimock/v3"
	"github.com/stretchr/testify/require"
	"golang.org/x/crypto/bcrypt"
	"testing"
)

func TestCreate(t *testing.T) {
	type userRepositoryMockFunc func(mc *minimock.Controller) repository.UserRepository
	type userTxManagerMockFunc func(mc *minimock.Controller) db.TxManager

	type args struct {
		ctx context.Context
		req *model.CreateUserModel
	}

	var (
		ctx = context.Background()
		mc  = minimock.NewController(t)

		repoErr = fmt.Errorf("repository error")

		id       = gofakeit.Int64()
		name     = gofakeit.Name()
		username = gofakeit.Username()
		role     = "ADMIN"
		password = gofakeit.Password(true, true, true, true, true, 1)

		correctReq = &model.CreateUserModel{
			Info: model.UserInfo{
				Username: username,
				Name:     name,
				Role:     role,
			},
			Password:        password,
			ConfirmPassword: password,
		}
		unMactchedPasswordsReq = &model.CreateUserModel{
			Info: model.UserInfo{
				Username: username,
				Name:     name,
				Role:     role,
			},
			Password:        password,
			ConfirmPassword: password[1:],
		}
	)

	tests := []struct {
		name               string
		args               args
		want               int64
		err                error
		userRepositoryMock userRepositoryMockFunc
		userTxManagerMock  userTxManagerMockFunc
	}{
		{
			name: "success case",
			args: args{
				ctx: ctx,
				req: correctReq,
			},
			want: id,
			err:  nil,
			userRepositoryMock: func(mc *minimock.Controller) repository.UserRepository {
				mock := mocks.NewUserRepositoryMock(mc)
				mock.CreateMock.Set(func(ctx context.Context, u *modelRepo.User) (int64, error) {
					require.Equal(t, name, u.Info.Name)
					require.Equal(t, username, u.Info.Username)
					require.Equal(t, role, u.Info.Role)
					require.NoError(t, bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password)))
					return id, nil
				})
				mock.CreateLogMock.Expect(ctx, id, "create_account").Return(nil)
				return mock
			},
			userTxManagerMock: func(mc *minimock.Controller) db.TxManager {
				mock := txMocks.NewTxManagerMock(mc)
				mock.ReadCommittedMock.Set(func(ctx context.Context, f db.Handler) error {
					return f(ctx)
				})
				return mock
			},
		},
		{
			name: "unmatched passwords case",
			args: args{
				ctx: ctx,
				req: unMactchedPasswordsReq,
			},
			want: 0,
			err:  user.ErrPasswordNotMatch,
			userRepositoryMock: func(mc *minimock.Controller) repository.UserRepository {
				mock := mocks.NewUserRepositoryMock(mc)
				return mock
			},
			userTxManagerMock: func(mc *minimock.Controller) db.TxManager {
				mock := txMocks.NewTxManagerMock(mc)
				return mock
			},
		},
		{
			name: "failure repo case",
			args: args{
				ctx: ctx,
				req: correctReq,
			},
			want: 0,
			err:  repoErr,
			userRepositoryMock: func(mc *minimock.Controller) repository.UserRepository {
				mock := mocks.NewUserRepositoryMock(mc)
				mock.CreateMock.Set(func(ctx context.Context, u *modelRepo.User) (int64, error) {
					return 0, repoErr
				})
				return mock
			},
			userTxManagerMock: func(mc *minimock.Controller) db.TxManager {
				mock := txMocks.NewTxManagerMock(mc)
				mock.ReadCommittedMock.Set(func(ctx context.Context, f db.Handler) error {
					return f(ctx)
				})
				return mock
			},
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			repoMock := tt.userRepositoryMock(mc)
			txManagerMock := tt.userTxManagerMock(mc)
			service := user.NewUserService(repoMock, txManagerMock)
			resId, err := service.Create(tt.args.ctx, tt.args.req)

			require.Equal(t, resId, tt.want)
			require.Equal(t, tt.err, err)
		})
	}
}
