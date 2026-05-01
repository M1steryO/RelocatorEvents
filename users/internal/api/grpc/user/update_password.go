package user

import (
	"context"
	"errors"
	domain "github.com/M1steryO/RelocatorEvents/users/internal/models/user"
	"github.com/M1steryO/RelocatorEvents/users/internal/service/user/dto"
	desc "github.com/M1steryO/RelocatorEvents/users/pkg/api/proto/user/v1"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/emptypb"
)

func (i *Implementation) UpdatePassword(ctx context.Context, req *desc.UpdatePasswordRequest) (*emptypb.Empty, error) {
	if req.GetId() == 0 {
		return nil, status.Errorf(codes.InvalidArgument, "invalid argument")
	}

	err := i.service.UpdatePassword(ctx, req.GetId(), &dto.UpdatePassword{
		OldPassword: req.GetOldPassword(),
		NewPassword: req.GetNewPassword(),
	})

	if err != nil {
		if errors.Is(err, domain.ErrUserNotFound) {
			return nil, status.Errorf(codes.NotFound, "user not found")
		}
		if errors.Is(err, domain.ErrIncorrectOldPassword) {
			return nil, status.Error(codes.FailedPrecondition, "incorrect old password")
		}
		return nil, err
	}

	return &emptypb.Empty{}, nil
}
