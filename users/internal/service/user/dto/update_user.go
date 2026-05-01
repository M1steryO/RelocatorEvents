package dto

import domain "github.com/M1steryO/RelocatorEvents/users/internal/models/user"

type UpdateUser struct {
	Name      *string
	Email     *string
	AvatarUrl *string
}

func (u UpdateUser) ToDomain() *domain.UpdateUser {
	return &domain.UpdateUser{
		Name:      u.Name,
		Email:     u.Email,
		AvatarURL: u.AvatarUrl,
	}
}
