package users

import (
	domain "github.com/M1steryO/RelocatorEvents/auth/internal/models/user"
	"github.com/M1steryO/RelocatorEvents/auth/internal/service/user/dto"
	desc "github.com/M1steryO/RelocatorEvents/users/pkg/api/proto/user/v1"
	"google.golang.org/protobuf/types/known/wrapperspb"
)

func toDomainUser(u *desc.User, password string) *domain.User {
	if u == nil {
		return nil
	}
	out := &domain.User{
		ID: u.GetId(),
		Info: domain.UserInfo{
			UserID: u.GetId(),
		},
		Password: password,
	}
	if u.GetCreatedAt() != nil {
		out.CreatedAt = u.GetCreatedAt().AsTime()
	}
	if u.GetUpdatedAt() != nil {
		t := u.GetUpdatedAt().AsTime()
		out.UpdatedAt = &t
	}
	info := u.GetInfo()
	if info != nil {
		out.Info.Name = info.GetName()
		if e := info.GetEmail(); e != nil {
			v := e.GetValue()
			out.Info.Email = &v
		}
		if tid := info.GetTelegramId(); tid != nil {
			v := tid.GetValue()
			out.Info.TelegramID = &v
		}
		out.Info.TelegramUsername = info.GetTelegramUsername()
		out.Info.City = info.GetCity()
		out.Info.Country = info.GetCountry()
		for _, in := range info.GetInterests() {
			out.Info.Interests = append(out.Info.Interests, domain.Interest{
				Code:  in.GetCode(),
				Title: in.GetTitle(),
			})
		}
	}
	return out
}

func toCreateRequest(user *dto.CreateUser, telegramID *int64) *desc.CreateRequest {
	if user == nil {
		return &desc.CreateRequest{}
	}
	req := &desc.CreateRequest{
		Password:        user.Password,
		PasswordConfirm: user.ConfirmPassword,
	}
	interests := make([]*desc.Interest, 0, len(user.Interests))
	for _, code := range user.Interests {
		interests = append(interests, &desc.Interest{Code: code})
	}
	req.Info = &desc.UserInfo{
		Name:             user.Name,
		TelegramUsername: user.TelegramUsername,
		Country:          user.Country,
		City:             user.City,
		Interests:        interests,
	}
	if user.Email != nil {
		req.Info.Email = wrapperspb.String(*user.Email)
	}
	if telegramID != nil {
		req.Info.TelegramId = wrapperspb.Int64(*telegramID)
	}
	return req
}
