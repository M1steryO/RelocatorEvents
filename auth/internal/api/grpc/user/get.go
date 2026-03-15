package user

import (
	"context"
	"errors"
	"github.com/M1steryO/RelocatorEvents/auth/internal/api/grpc/converter"
	domain "github.com/M1steryO/RelocatorEvents/auth/internal/models/user"
	desc "github.com/M1steryO/RelocatorEvents/auth/pkg/api/proto/user/v1"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (i *Implementation) Get(ctx context.Context, req *desc.GetRequest) (*desc.GetResponse, error) {
	if req.Id == 0 {
		userId, ok := ctx.Value("userId").(int64)

		if !ok {
			return nil, errors.New("missing userId")
		}
		req.Id = userId
	}

	user, err := i.service.Get(ctx, req.GetId())

	if err != nil {
		if errors.Is(err, domain.ErrUserNotFound) {
			return nil, status.Errorf(codes.NotFound, "user not found")
		}
		return nil, err
	}
	return &desc.GetResponse{
		User: converter.ToUserApiFromDomain(user),
	}, nil
}
