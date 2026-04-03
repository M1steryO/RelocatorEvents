package user

import (
	"context"
	"errors"
	"github.com/M1steryO/RelocatorEvents/users/internal/api/grpc/converter"
	domain "github.com/M1steryO/RelocatorEvents/users/internal/models/user"
	desc "github.com/M1steryO/RelocatorEvents/users/pkg/api/proto/user/v1"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
	"strconv"
)

func (i *Implementation) Get(ctx context.Context, req *desc.GetRequest) (*desc.GetResponse, error) {
	if req.Id == 0 {
		md, ok := metadata.FromIncomingContext(ctx)
		if !ok {
			return nil, errors.New("metadata is not provided")
		}
		userIdMetadata, ok := md["x-user-id"]
		if !ok {
			return nil, errors.New("metadata is not provided")
		}
		if len(userIdMetadata) != 1 {
			return nil, errors.New("metadata is not provided")
		}
		userId, err := strconv.ParseInt(userIdMetadata[0], 10, 64)
		if err != nil {
			return nil, errors.New("metadata is not provided")
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
