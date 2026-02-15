package converters

import (
	domain "github.com/M1steryO/RelocatorEvents/events/internal/domain/reviews"
	"github.com/M1steryO/RelocatorEvents/events/internal/repository/reviews/model"
	"strings"
)

func ReviewFromRepo(m *model.Review) *domain.Review {
	if m == nil {
		return nil
	}

	media := make([]*domain.MediaAttachment, 0, len(m.Media))
	for _, a := range m.Media {
		if a == nil {
			continue
		}

		mt := mediaTypeFromDB(a.Type)

		media = append(media, &domain.MediaAttachment{
			StorageKey: a.Key,
			Type:       mt,
		})
	}

	return &domain.Review{
		Grade:         m.Grade,
		Advantages:    m.Advantages,
		Disadvantages: m.Disadvantages,
		Text:          m.Text,
		Media:         media,
		AuthorId:      m.AuthorId,
		CreatedAt:     m.CreatedAt,
	}
}

func ReviewsFromRepo(m []*model.Review) []*domain.Review {
	if len(m) == 0 {
		return nil
	}

	out := make([]*domain.Review, 0, len(m))

	for _, r := range m {
		if r == nil {
			continue
		}

		dr := ReviewFromRepo(r)

		out = append(out, dr)
	}

	return out
}

func mediaTypeFromDB(s string) domain.MediaType {
	switch strings.ToLower(strings.TrimSpace(s)) {
	case "image":
		return domain.MediaTypeImage
	case "video":
		return domain.MediaTypeVideo
	case "unknown":
		return domain.MediaTypeUnknown
	default:
		return ""
	}
}
