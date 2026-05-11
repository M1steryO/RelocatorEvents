package auth

import (
	"context"
	"testing"
	"time"

	"github.com/M1steryO/RelocatorEvents/auth/internal/models/user"
	"github.com/M1steryO/RelocatorEvents/auth/internal/service/user/dto"
	"golang.org/x/crypto/bcrypt"
)

type jwtConfigFake struct{}

func (c jwtConfigFake) AccessSecret() []byte {
	return []byte("access-secret")
}

func (c jwtConfigFake) RefreshSecret() []byte {
	return []byte("refresh-secret")
}

func (c jwtConfigFake) AccessExpiration() time.Duration {
	return time.Hour
}

func (c jwtConfigFake) RefreshExpiration() time.Duration {
	return 24 * time.Hour
}

type userServiceFake struct {
	userByEmail      *user.User
	getByEmailErr    error
	getByEmailValue  string
	userByTelegramID *user.User
	telegramIDValue  int64
}

func (s *userServiceFake) Get(context.Context, int64) (*user.User, error) {
	panic("unexpected call")
}

func (s *userServiceFake) Create(context.Context, *dto.CreateUser) (int64, error) {
	panic("unexpected call")
}

func (s *userServiceFake) GetByTelegramId(_ context.Context, telegramId int64) (*user.User, error) {
	s.telegramIDValue = telegramId
	return s.userByTelegramID, nil
}

func (s *userServiceFake) GetByEmail(_ context.Context, email string) (*user.User, error) {
	s.getByEmailValue = email
	return s.userByEmail, s.getByEmailErr
}

func TestLoginIssuesTokensForValidPassword(t *testing.T) {
	t.Parallel()

	passwordHash, err := bcrypt.GenerateFromPassword([]byte("correct-password"), bcrypt.DefaultCost)
	if err != nil {
		t.Fatalf("GenerateFromPassword() error = %v", err)
	}
	userService := &userServiceFake{
		userByEmail: &user.User{
			ID:       42,
			Password: string(passwordHash),
		},
	}
	svc := NewAuthService(userService, nil, jwtConfigFake{})

	creds, err := svc.Login(context.Background(), "user@example.com", "correct-password")
	if err != nil {
		t.Fatalf("Login() error = %v", err)
	}

	if userService.getByEmailValue != "user@example.com" {
		t.Fatalf("GetByEmail() email = %q, want user@example.com", userService.getByEmailValue)
	}
	if creds.AccessToken == "" {
		t.Fatalf("AccessToken is empty")
	}
	if creds.RefreshToken == "" {
		t.Fatalf("RefreshToken is empty")
	}
}

func TestLoginRejectsWrongPassword(t *testing.T) {
	t.Parallel()

	passwordHash, err := bcrypt.GenerateFromPassword([]byte("correct-password"), bcrypt.DefaultCost)
	if err != nil {
		t.Fatalf("GenerateFromPassword() error = %v", err)
	}
	svc := NewAuthService(&userServiceFake{
		userByEmail: &user.User{
			ID:       42,
			Password: string(passwordHash),
		},
	}, nil, jwtConfigFake{})

	creds, err := svc.Login(context.Background(), "user@example.com", "wrong-password")
	if err == nil {
		t.Fatalf("Login() error = nil, want error")
	}
	if creds != nil {
		t.Fatalf("Login() creds = %#v, want nil", creds)
	}
}

func TestTelegramLoginIssuesTokensForTelegramUser(t *testing.T) {
	t.Parallel()

	userService := &userServiceFake{
		userByTelegramID: &user.User{ID: 99},
	}
	svc := NewAuthService(userService, nil, jwtConfigFake{})

	creds, err := svc.TelegramLogin(context.Background(), 123456)
	if err != nil {
		t.Fatalf("TelegramLogin() error = %v", err)
	}

	if userService.telegramIDValue != 123456 {
		t.Fatalf("GetByTelegramId() id = %d, want 123456", userService.telegramIDValue)
	}
	if creds.AccessToken == "" {
		t.Fatalf("AccessToken is empty")
	}
	if creds.RefreshToken == "" {
		t.Fatalf("RefreshToken is empty")
	}
}
