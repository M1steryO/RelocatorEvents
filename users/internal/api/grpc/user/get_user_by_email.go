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

func (i *Implementation) GetUserByEmail(ctx context.Context, req *desc.GetUserByEmailRequest) (*desc.GetUserByEmailResponse, error) {
	if req.GetEmail() == "" {
		return nil, status.Errorf(codes.InvalidArgument, "invalid argument")
	}

	user, err := i.service.GetByEmail(ctx, req.GetEmail())

	if err != nil {
		if errors.Is(err, domain.ErrUserNotFound) {
			return nil, status.Errorf(codes.NotFound, "user not found")
		}
		return nil, err
	}

	return &desc.GetUserByEmailResponse{
		User: converter.ToUserApiFromDomain(user),
	}, nil
}
