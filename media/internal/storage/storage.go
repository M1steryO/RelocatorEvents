package storage

import (
	"context"
	"github.com/M1steryO/RelocatorEvents/media/internal/domain"
)

type MediaStorage interface {
	Upload(ctx context.Context, input domain.UploadInput) (string, error)
	GetPresignedUrl(ctx context.Context, key string) (*domain.PresignedOutput, error)
}
