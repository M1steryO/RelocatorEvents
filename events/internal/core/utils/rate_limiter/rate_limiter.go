package rate_limiter

import (
	"context"
	"time"
)

type TokenBucketLimiter struct {
	tokenBucketCh chan struct{}
}

func NewRateLimiter(ctx context.Context, limit int, period time.Duration) *TokenBucketLimiter {
	limiter := &TokenBucketLimiter{
		tokenBucketCh: make(chan struct{}, limit),
	}
	for i := 0; i < limit; i++ {
		limiter.tokenBucketCh <- struct{}{}
	}
	replenishmentInterval := period.Nanoseconds() / int64(limit)
	go limiter.startPeriodReplenishment(ctx, time.Duration(replenishmentInterval))
	return limiter
}

func (r *TokenBucketLimiter) startPeriodReplenishment(ctx context.Context, interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			r.tokenBucketCh <- struct{}{}
		case <-ctx.Done():
			return
		}

	}
}
func (r *TokenBucketLimiter) Allow() bool {
	select {
	case <-r.tokenBucketCh:
		return true
	default:
		return false
	}
}
