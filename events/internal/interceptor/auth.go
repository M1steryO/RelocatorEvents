package interceptor

import (
	"context"
	"google.golang.org/grpc"
)

func AuthInterceptor(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
	//md, ok := metadata.FromIncomingContext(ctx)
	//if !ok {
	//	return nil, errors.New("metadata is not provided")
	//}
	//authHeader, ok := md["x-user-id"]
	ctx = context.WithValue(ctx, "userId", int64(2))
	return handler(ctx, req)
}
