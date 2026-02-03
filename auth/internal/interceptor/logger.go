package interceptor

import (
	"context"
	"github.com/M1steryO/RelocatorEvents/auth/internal/logger"
	"google.golang.org/grpc"
	"log/slog"
	"time"
)

func LoggerInterceptor(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
	now := time.Now()

	resp, err := handler(ctx, req)
	if err != nil {
		logger.Error(err.Error(), slog.String("method", info.FullMethod), slog.Any("req", req))
	}
	logger.Info("request", slog.String("method", info.FullMethod), slog.Any("req", req), slog.Any("duration", time.Since(now)))

	return resp, err
}
