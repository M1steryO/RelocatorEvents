package media

import (
	"github.com/M1steryO/RelocatorEvents/media/internal/client/kafka"
	"github.com/M1steryO/RelocatorEvents/media/internal/storage"
)

type serv struct {
	storage  storage.MediaStorage
	producer *kafka.Producer
}

func NewMediaService(storage storage.MediaStorage, producer *kafka.Producer) *serv {
	return &serv{
		storage:  storage,
		producer: producer,
	}

}
