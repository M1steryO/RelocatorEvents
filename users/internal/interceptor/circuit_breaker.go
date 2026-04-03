package interceptor

import (
	"context"
	"errors"
	"github.com/sony/gobreaker"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type CircuitBreakerInterceptor struct {
	breaker *gobreaker.CircuitBreaker
}

func NewCircuitBreakerInterceptor(br *gobreaker.CircuitBreaker) *CircuitBreakerInterceptor {
	return &CircuitBreakerInterceptor{
		breaker: br,
	}
}

func (i *CircuitBreakerInterceptor) Unary(ctx context.Context, req interface{}, _ *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
	res, err := i.breaker.Execute(func() (interface{}, error) {
		return handler(ctx, req)
	})
	if err != nil {
		if errors.Is(err, gobreaker.ErrOpenState) {
			return nil, status.Error(codes.Unavailable, "service unavailable")
		}
		return nil, err
	}
	return res, err
}
