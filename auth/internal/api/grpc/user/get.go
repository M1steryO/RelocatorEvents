package user

import (
	"context"
	"errors"
	"github.com/M1steryO/RelocatorEvents/auth/internal/api/grpc/converter"
	domain "github.com/M1steryO/RelocatorEvents/auth/internal/domain/user"
	"github.com/M1steryO/RelocatorEvents/auth/internal/logger"
	desc "github.com/M1steryO/RelocatorEvents/auth/pkg/user_v1"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"log/slog"
)

func (i *Implementation) Get(ctx context.Context, req *desc.GetRequest) (*desc.GetResponse, error) {
	if req.Id == 0 {
		return nil, status.Errorf(codes.InvalidArgument, "invalid argument")
	}
	logger.Info("Received", slog.Int64("id:", req.GetId()))

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
