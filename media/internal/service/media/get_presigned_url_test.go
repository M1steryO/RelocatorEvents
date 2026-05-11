package media

import (
	"context"
	"strings"
	"testing"

	"github.com/M1steryO/RelocatorEvents/media/internal/domain"
)

type mediaStorageFake struct {
	key    string
	output *domain.PresignedOutput
	err    error
}

func (s *mediaStorageFake) Upload(context.Context, domain.UploadInput) (string, error) {
	panic("unexpected call")
}

func (s *mediaStorageFake) GetPresignedUrl(_ context.Context, key string) (*domain.PresignedOutput, error) {
	s.key = key
	if s.output != nil {
		s.output.ObjectKey = key
	}
	return s.output, s.err
}

func TestGetPresignedUrlBuildsReviewObjectKey(t *testing.T) {
	t.Parallel()

	storage := &mediaStorageFake{
		output: &domain.PresignedOutput{Url: "https://storage.example/upload"},
	}
	svc := NewMediaService(storage, nil)

	output, err := svc.GetPresignedUrl(context.Background(), "poster.large.JPG", 555)
	if err != nil {
		t.Fatalf("GetPresignedUrl() error = %v", err)
	}

	if output == nil {
		t.Fatalf("GetPresignedUrl() output = nil")
	}
	if output.Url != "https://storage.example/upload" {
		t.Fatalf("Url = %q, want https://storage.example/upload", output.Url)
	}
	if output.ObjectKey != storage.key {
		t.Fatalf("ObjectKey = %q, want storage key %q", output.ObjectKey, storage.key)
	}
	if !strings.HasPrefix(storage.key, "reviews/555/") {
		t.Fatalf("storage key = %q, want reviews/555 prefix", storage.key)
	}
	if !strings.HasSuffix(storage.key, ".JPG") {
		t.Fatalf("storage key = %q, want .JPG suffix", storage.key)
	}
}

func TestMakeObjectKeyOmitsExtensionWhenOriginalNameHasNoExtension(t *testing.T) {
	t.Parallel()

	key, err := makeObjectKey("reviews/777", "")
	if err != nil {
		t.Fatalf("makeObjectKey() error = %v", err)
	}

	if !strings.HasPrefix(key, "reviews/777/") {
		t.Fatalf("key = %q, want reviews/777 prefix", key)
	}
	if strings.HasSuffix(key, ".") {
		t.Fatalf("key = %q, want no trailing dot", key)
	}
}
