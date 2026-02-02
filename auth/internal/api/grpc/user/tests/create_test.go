package tests

import (
	"auth/internal/api/grpc/user"
	"auth/internal/logger"
	"auth/internal/service"
	"auth/internal/service/mocks"
	"auth/internal/service/user/model"
	desc "auth/pkg/user_v1"
	"context"
	"fmt"
	"github.com/brianvoe/gofakeit/v7"
	"github.com/gojuno/minimock/v3"
	"github.com/stretchr/testify/require"
	"testing"
)

func TestCreate(t *testing.T) {
	type userServiceMockFunc func(mc *minimock.Controller) service.UserService
	logger.Init("local")
	type args struct {
		ctx context.Context
		req *desc.CreateRequest
	}
	var (
		ctx = context.Background()
		mc  = minimock.NewController(t)

		id       = gofakeit.Int64()
		name     = gofakeit.Name()
		username = gofakeit.Username()
		role     = "ADMIN"
		password = gofakeit.Password(true, true, true, true, true, 1)

		serviceErr = fmt.Errorf("service error")

		req = &desc.CreateRequest{
			Info: &desc.UserInfo{
				Name:     name,
				Username: username,
				Role:     desc.Role_ADMIN,
			},
			Password:        password,
			PasswordConfirm: password,
		}

		serviceReq = &model.CreateUserModel{
			Info: model.UserInfo{
				Name:     name,
				Username: username,
				Role:     role,
			},
			Password:        password,
			ConfirmPassword: password,
		}

		res = &desc.CreateResponse{
			Id: id,
		}
	)

	tests := []struct {
		name            string
		args            args
		want            *desc.CreateResponse
		err             error
		userServiceMock userServiceMockFunc
	}{{
		name: "success case",
		args: args{
			ctx: ctx,
			req: req,
		},
		want: res,
		err:  nil,
		userServiceMock: func(mc *minimock.Controller) service.UserService {
			mock := mocks.NewUserServiceMock(mc)
			mock.CreateMock.Expect(ctx, serviceReq).Return(id, nil)
			return mock
		},
	}, {
		name: "failure case",
		args: args{
			ctx: ctx,
			req: req,
		},
		want: nil,
		err:  serviceErr,
		userServiceMock: func(mc *minimock.Controller) service.UserService {
			mock := mocks.NewUserServiceMock(mc)
			mock.CreateMock.Expect(ctx, serviceReq).Return(0, serviceErr)
			return mock
		},
	},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			userServiceMock := tt.userServiceMock(mc)
			api := user.NewUserImplementation(userServiceMock)
			resp, err := api.Create(tt.args.ctx, tt.args.req)
			require.Equal(t, tt.err, err)
			require.Equal(t, tt.want, resp)
		})
	}

}
