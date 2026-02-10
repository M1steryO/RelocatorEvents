package media

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"github.com/M1steryO/RelocatorEvents/media/internal/domain"
	"path"
	"strconv"
	"strings"
	"time"
)

func randHex(nBytes int) (string, error) {
	b := make([]byte, nBytes)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

func makeObjectKey(prefix string, ext string) (string, error) {
	id, err := randHex(16)
	if err != nil {
		return "", err
	}

	date := time.Now().UTC().Format("2006/01/02")
	name := id
	if ext != "" {
		ext = strings.TrimPrefix(ext, ".")
		name = name + "." + ext
	}
	return path.Join(prefix, date, name), nil
}

const basePrefix = "reviews"

func (s *serv) GetPresignedUrl(ctx context.Context, originalName string, reviewId int64) (*domain.PresignedOutput, error) {
	ext := path.Ext(originalName)
	prefix := path.Join(basePrefix, strconv.FormatInt(reviewId, 10))

	objectKey, err := makeObjectKey(prefix, ext)
	if err != nil {
		return nil, err
	}

	outputObject, err := s.storage.GetPresignedUrl(ctx, objectKey)
	if err != nil {
		return nil, err
	}

	return outputObject, nil
}
