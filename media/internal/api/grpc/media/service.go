package media

import (
	"github.com/M1steryO/RelocatorEvents/media/internal/service"
	"github.com/M1steryO/RelocatorEvents/media/pkg/api/media/v1"
)

type MediaImpl struct {
	media.UnimplementedMediaServiceServer
	serv service.MediaService
}

func NewMediaImplementation(serv service.MediaService) *MediaImpl {
	return &MediaImpl{
		serv: serv,
	}
}
