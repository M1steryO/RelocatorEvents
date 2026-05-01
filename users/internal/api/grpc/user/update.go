package user

import (
	"context"
	"errors"
	"github.com/M1steryO/RelocatorEvents/users/internal/api/grpc/converter"
	domain "github.com/M1steryO/RelocatorEvents/users/internal/models/user"
	desc "github.com/M1steryO/RelocatorEvents/users/pkg/api/proto/user/v1"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/emptypb"
)

func (i *Implementation) Update(ctx context.Context, req *desc.UpdateRequest) (*emptypb.Empty, error) {
	if req.GetId() == 0 {
		return nil, status.Errorf(codes.InvalidArgument, "invalid argument")
	}

	err := i.service.Update(ctx, req.GetId(),
		converter.ToUpdateUserDtoInfoFromApi(req.Info))

	if err != nil {
		if errors.Is(err, domain.ErrUserNotFound) {
			return nil, status.Errorf(codes.NotFound, "user not found")
		}
		return nil, err
	}

	return &emptypb.Empty{}, nil
}
