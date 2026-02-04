package access

import (
	"context"
	desc "github.com/M1steryO/RelocatorEvents/auth/pkg/access_v1"
)

func (i *Implementation) Check(ctx context.Context, req *desc.CheckRequest) (*desc.CheckResponse, error) {
	return &desc.CheckResponse{}, nil
}
