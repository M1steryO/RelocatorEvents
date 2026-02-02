package reviews

import (
	domain "events/internal/domain/reviews"
	desc "events/pkg/reviews_v1"
	"fmt"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func mediaTypeFromProto(t desc.MediaType) (domain.MediaType, error) {
	switch t {
	case desc.MediaType_MEDIA_TYPE_IMAGE:
		return domain.MediaTypeImage, nil
	case desc.MediaType_MEDIA_TYPE_VIDEO:
		return domain.MediaTypeVideo, nil
	case desc.MediaType_MEDIA_TYPE_UNKNOWN:
		return domain.MediaTypeUnknown, nil
	default:
		return "", fmt.Errorf("unknown media type: %v", t)
	}
}

func ReviewFromProto(r *desc.Review) (*domain.Review, error) {
	if r == nil {
		return nil, nil
	}

	mediaList := make([]*domain.MediaAttachment, 0, len(r.Media))
	for _, m := range r.Media {
		mt, err := mediaTypeFromProto(m.Type)
		if err != nil {
			return nil, err
		}
		mediaList = append(mediaList, &domain.MediaAttachment{
			StorageKey: m.StorageKey,
			Type:       mt,
		})
	}

	return &domain.Review{
		Grade:         int(r.Grade),
		Advantages:    r.Advantages,
		Disadvantages: r.Disadvantages,
		Text:          r.Text,
		Media:         mediaList,
	}, nil
}

func ReviewToProto(r *domain.Review) *desc.Review {
	if r == nil {
		return nil
	}

	media := make([]*desc.MediaAttachment, 0, len(r.Media))
	for _, m := range r.Media {
		if m == nil {
			continue
		}
		media = append(media, &desc.MediaAttachment{
			StorageKey: m.StorageKey,
			Type:       mediaTypeToProto(m.Type),
		})
	}

	return &desc.Review{
		Grade:         int32(r.Grade),
		Advantages:    r.Advantages,
		Disadvantages: r.Disadvantages,
		Text:          r.Text,
		Media:         media,
		AuthorId:      r.AuthorId,
		CreatedAt:     timestamppb.New(r.CreatedAt),
	}
}

func mediaTypeToProto(t domain.MediaType) desc.MediaType {
	switch t {
	case domain.MediaTypeImage:
		return desc.MediaType_MEDIA_TYPE_IMAGE
	case domain.MediaTypeVideo:
		return desc.MediaType_MEDIA_TYPE_VIDEO
	default:
		return desc.MediaType_MEDIA_TYPE_UNKNOWN
	}
}

func ReviewsToProto(in []*domain.Review) []*desc.Review {
	if len(in) == 0 {
		return nil
	}
	out := make([]*desc.Review, 0, len(in))
	for _, r := range in {
		if pr := ReviewToProto(r); pr != nil {
			out = append(out, pr)
		}
	}
	return out
}
