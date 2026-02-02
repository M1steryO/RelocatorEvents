package user

import (
	"auth/internal/api/grpc/converter"
	"auth/internal/logger"
	userRepo "auth/internal/repository/user"
	desc "auth/pkg/user_v1"
	"context"
	"errors"
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
		if errors.Is(err, userRepo.ErrUserNotFound) {
			return nil, status.Errorf(codes.NotFound, "user not found")
		}
		return nil, err
	}
	return &desc.GetResponse{
		User: converter.ToUserApiFromDomain(user),
	}, nil
}
