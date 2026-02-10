package s3

import (
	"context"
	"io"
)

type MediaStorage interface {
	Upload(ctx context.Context, file io.Reader, size int64, contentType string) (string, error)
}
