package grpc

import "context"

type AuthServiceClient interface {
	Check(ctx context.Context) error
}

type UserServiceClient interface {
	GetUserCountry(context.Context, int64) (string, error)
}
