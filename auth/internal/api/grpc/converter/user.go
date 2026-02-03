package converter

import (
	"github.com/M1steryO/RelocatorEvents/auth/internal/domain/user"
	"github.com/M1steryO/RelocatorEvents/auth/internal/service/user/dto"
	desc "github.com/M1steryO/RelocatorEvents/auth/pkg/user_v1"
	"google.golang.org/protobuf/types/known/timestamppb"
	"google.golang.org/protobuf/types/known/wrapperspb"
)

func ToInterestsDtoFromApi(interests []*desc.Interest) []string {
	converted := make([]string, len(interests))
	for i, interest := range interests {
		converted[i] = interest.Code
	}

	return converted
}

func ToCreateUserDtoInfoFromApi(req *desc.CreateRequest, telegramId *int64) *dto.CreateUser {
	if req.Info == nil {
		return &dto.CreateUser{}
	}

	return &dto.CreateUser{
		Name:             req.Info.Name,
		Email:            req.Info.Email,
		TelegramId:       telegramId,
		TelegramUsername: req.Info.TelegramUsername,

		Password:        req.Password,
		ConfirmPassword: req.PasswordConfirm,

		Country: req.Info.Country,
		City:    req.Info.City,

		Interests: ToInterestsDtoFromApi(req.Info.Interests),
	}
}

func ToInterestsApiFromDomain(interests []user.Interest) []*desc.Interest {
	converted := make([]*desc.Interest, len(interests))
	for i, interest := range interests {
		converted[i] = &desc.Interest{
			Code:  interest.Code,
			Title: interest.Title,
		}
	}

	return converted
}

func ToUserApiFromDomain(user *user.User) *desc.User {
	return &desc.User{
		Id: user.ID,
		Info: &desc.UserInfo{
			Name:    user.Info.Name,
			Email:   user.Info.Email,
			City:    user.Info.City,
			Country: user.Info.Country,

			TelegramId: func() *wrapperspb.Int64Value {
				if user.Info.TelegramID != nil {
					return &wrapperspb.Int64Value{
						Value: *user.Info.TelegramID,
					}
				}
				return nil
			}(),
			TelegramUsername: user.Info.TelegramUsername,

			Interests: ToInterestsApiFromDomain(user.Info.Interests),
		},
		CreatedAt: timestamppb.New(user.CreatedAt),
		UpdatedAt: func() *timestamppb.Timestamp {
			var updatedAt *timestamppb.Timestamp
			if user.UpdatedAt != nil {
				updatedAt = timestamppb.New(*user.UpdatedAt)
			}
			return updatedAt
		}(),
	}
}
