package reviews

import "time"

type MediaType string

const (
	MediaTypeImage   MediaType = "image"
	MediaTypeVideo   MediaType = "video"
	MediaTypeUnknown MediaType = "unknown"
)

type MediaAttachment struct {
	StorageKey string
	Type       MediaType
}

type Review struct {
	Grade         int
	Advantages    string
	Disadvantages string
	Text          string
	Media         []*MediaAttachment
	AuthorId      int64
	CreatedAt     time.Time
}
