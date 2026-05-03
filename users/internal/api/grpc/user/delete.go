package user

import (
	"context"
	"errors"
	domain "github.com/M1steryO/RelocatorEvents/users/internal/models/user"
	desc "github.com/M1steryO/RelocatorEvents/users/pkg/api/proto/user/v1"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/emptypb"
)

func (i *Implementation) Delete(ctx context.Context, req *desc.DeleteRequest) (*emptypb.Empty, error) {
	if req.GetId() == 0 {
		return nil, status.Errorf(codes.InvalidArgument, "invalid argument")
	}

	err := i.service.Delete(ctx, req.GetId())

	if err != nil {
		if errors.Is(err, domain.ErrUserNotFound) {
			return nil, status.Errorf(codes.NotFound, "user not found")
		}

		return nil, err
	}

	return &emptypb.Empty{}, nil
}
