package media

import (
	"context"
	"github.com/M1steryO/RelocatorEvents/media/internal/core/logger"
	"github.com/M1steryO/RelocatorEvents/media/internal/domain"
	desc "github.com/M1steryO/RelocatorEvents/media/pkg/api/media/v1"
)

func (i *MediaImpl) GetReviewPresignedUrl(ctx context.Context, req *desc.GetReviewPresignedUrlRequest) (*desc.GetReviewPresignedUrlResponse, error) {
	outputObject, err := i.serv.GetPresignedUrl(ctx, req.GetObjectName(), req.GetReviewId())
	userId, ok := ctx.Value("userId").(int64)
	if !ok {
		return nil, domain.ErrMissingUserId
	}

	if err != nil {
		return nil, err
	}
	logger.Info("pre-signed url successfully received", "url", outputObject.Url, "userId", userId)
	return &desc.GetReviewPresignedUrlResponse{
		PresignedUrl: outputObject.Url,
		ObjectKey:    outputObject.ObjectKey,
	}, nil
}
