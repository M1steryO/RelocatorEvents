package users

import (
	"context"

	domain "github.com/M1steryO/RelocatorEvents/auth/internal/models/user"
	"github.com/M1steryO/RelocatorEvents/auth/internal/service"
	"github.com/M1steryO/RelocatorEvents/auth/internal/service/user/dto"
	desc "github.com/M1steryO/RelocatorEvents/users/pkg/api/proto/user/v1"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type userService struct {
	client desc.UserServiceClient
}

func NewUserService(client desc.UserServiceClient) service.UserService {
	return &userService{client: client}
}

func (s *userService) Get(ctx context.Context, id int64) (*domain.User, error) {
	resp, err := s.client.Get(ctx, &desc.GetRequest{Id: id})
	if err != nil {
		return nil, mapUserClientError(err)
	}
	return toDomainUser(resp.GetUser()), nil
}

func (s *userService) Create(ctx context.Context, user *dto.CreateUser) (int64, error) {
	req := toCreateRequest(user, user.TelegramId)
	resp, err := s.client.Create(ctx, req)
	if err != nil {
		return 0, mapUserClientError(err)
	}
	return resp.GetId(), nil
}

func (s *userService) GetByTelegramId(ctx context.Context, telegramId int64) (*domain.User, error) {
	resp, err := s.client.GetUserByTelegramId(ctx, &desc.GetUserByTelegramIdRequest{TelegramId: telegramId})
	if err != nil {
		return nil, mapUserClientError(err)
	}
	return toDomainUser(resp.GetUser()), nil
}

func mapUserClientError(err error) error {
	st, ok := status.FromError(err)
	if !ok {
		return err
	}
	switch st.Code() {
	case codes.NotFound:
		return domain.ErrUserNotFound
	case codes.AlreadyExists:
		return domain.ErrUserExists
	default:
		return err
	}
}

var _ service.UserService = (*userService)(nil)
