package service

import (
	"context"
	"github.com/M1steryO/RelocatorEvents/media/internal/domain"
)

type MediaService interface {
	Upload(ctx context.Context, input domain.UploadInput) error
	GetPresignedUrl(ctx context.Context, originalName string, reviewId int64) (*domain.PresignedOutput, error)
}
