package user

import (
	"context"
	"errors"
	"github.com/M1steryO/RelocatorEvents/users/internal/api/grpc/converter"
	domain "github.com/M1steryO/RelocatorEvents/users/internal/models/user"
	desc "github.com/M1steryO/RelocatorEvents/users/pkg/api/proto/user/v1"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (i *Implementation) GetUserByTelegramId(ctx context.Context, req *desc.GetUserByTelegramIdRequest) (*desc.GetUserByTelegramIdResponse, error) {
	if req.TelegramId == 0 {
		return nil, status.Errorf(codes.InvalidArgument, "invalid argument")
	}

	user, err := i.service.GetByTelegramId(ctx, req.GetTelegramId())

	if err != nil {
		if errors.Is(err, domain.ErrUserNotFound) {
			return nil, status.Errorf(codes.NotFound, "user not found")
		}
		return nil, err
	}

	return &desc.GetUserByTelegramIdResponse{
		User: converter.ToUserApiFromDomain(user),
	}, nil
}
