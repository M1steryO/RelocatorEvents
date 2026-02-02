package converter

import (
	"auth/internal/domain/user"
	modelRepo "auth/internal/repository/user/model"
	"time"
)

func ToUserInterestFromRepo(interests []modelRepo.UserInterest) []user.Interest {
	result := make([]user.Interest, len(interests))
	for i, interest := range interests {
		result[i] = user.Interest{
			ID:    interest.Id,
			Code:  interest.Code,
			Title: interest.Title,
		}

	}
	return result
}

func ToUserInfoFromRepo(userInfo *modelRepo.UserInfo) user.UserInfo {
	return user.UserInfo{
		Name:  userInfo.Name,
		Email: userInfo.Email,

		TelegramID:       userInfo.TelegramId,
		TelegramUsername: userInfo.TelegramUsername,

		City:      userInfo.City,
		Country:   userInfo.Country,
		Interests: ToUserInterestFromRepo(userInfo.Interests),
	}
}

func ToUserFromRepo(u *modelRepo.User) *user.User {
	return &user.User{
		ID:        u.Id,
		Info:      ToUserInfoFromRepo(u.Info),
		CreatedAt: u.CreatedAt,
		UpdatedAt: func() *time.Time {
			var updatedAt *time.Time
			if u.UpdatedAt.Valid {
				updatedAt = &u.UpdatedAt.Time
			}
			return updatedAt
		}(),
	}
}
