package tests

import (
	"auth/internal/repository"
	"auth/internal/repository/mocks"
	modelRepo "auth/internal/repository/user/model"
	"auth/internal/service/user"
	"auth/internal/service/user/model"
	"context"
	"database/sql"
	"fmt"
	"github.com/M1steryO/platform_common/pkg/db"
	txMocks "github.com/M1steryO/platform_common/pkg/db/mocks"
	"github.com/brianvoe/gofakeit/v7"
	"github.com/gojuno/minimock/v3"
	"github.com/stretchr/testify/require"
	"testing"
)

func TestGet(t *testing.T) {
	type userRepositoryMockFunc func(mc *minimock.Controller) repository.UserRepository
	type userTxManagerMockFunc func(mc *minimock.Controller) db.TxManager

	type args struct {
		ctx context.Context
		id  int64
	}

	var (
		ctx = context.Background()
		mc  = minimock.NewController(t)

		repoErr = fmt.Errorf("repository error")

		id        = gofakeit.Int64()
		name      = gofakeit.Name()
		username  = gofakeit.Username()
		role      = "ADMIN"
		createdAt = gofakeit.Date()
		updatedAt = gofakeit.Date()

		resp = &model.User{
			Info: model.UserInfo{
				Name:     name,
				Username: username,
				Role:     role,
			},
			CreatedAt: createdAt,
			UpdatedAt: sql.NullTime{
				Valid: true,
				Time:  updatedAt,
			},
		}
		repoResp = &modelRepo.User{
			Info: modelRepo.UserInfo{
				Username: username,
				Name:     name,
				Role:     role,
			},
			CreatedAt: createdAt,
			UpdatedAt: sql.NullTime{
				Valid: true,
				Time:  updatedAt,
			},
		}
	)

	tests := []struct {
		name               string
		args               args
		want               *model.User
		err                error
		userRepositoryMock userRepositoryMockFunc
		userTxManagerMock  userTxManagerMockFunc
	}{
		{
			name: "success case",
			args: args{
				ctx: ctx,
				id:  id,
			},
			want: resp,
			err:  nil,
			userRepositoryMock: func(mc *minimock.Controller) repository.UserRepository {
				mock := mocks.NewUserRepositoryMock(mc)
				mock.GetMock.Expect(ctx, id).Return(repoResp, nil)
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
				id:  id,
			},
			want: nil,
			err:  repoErr,
			userRepositoryMock: func(mc *minimock.Controller) repository.UserRepository {
				mock := mocks.NewUserRepositoryMock(mc)
				mock.GetMock.Expect(ctx, id).Return(nil, repoErr)
				return mock
			},
			userTxManagerMock: func(mc *minimock.Controller) db.TxManager {
				mock := txMocks.NewTxManagerMock(mc)
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
			resp, err := service.Get(tt.args.ctx, tt.args.id)

			require.Equal(t, resp, tt.want)
			require.Equal(t, tt.err, err)
		})
	}
}
