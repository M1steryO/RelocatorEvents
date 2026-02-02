package grpc

import "context"

type AuthServiceClient interface {
	Check(ctx context.Context) error
}
