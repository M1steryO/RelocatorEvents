package user

import (
	"context"
	"errors"
	"reflect"
	"testing"

	domain "github.com/M1steryO/RelocatorEvents/users/internal/models/user"
	"github.com/M1steryO/RelocatorEvents/users/internal/service/user/dto"
	"github.com/M1steryO/platform_common/pkg/db"
	"golang.org/x/crypto/bcrypt"
)

type txManagerFake struct {
	calls int
	err   error
}

func (m *txManagerFake) ReadCommitted(ctx context.Context, f db.Handler) error {
	m.calls++
	if m.err != nil {
		return m.err
	}
	return f(ctx)
}

type userRepositoryFake struct {
	getUser *domain.User
	getErr  error

	createUser *domain.User
	createID   int64
	createErr  error

	createUserDataID               int64
	createUserDataTelegramUsername string
	createUserDataInfo             *domain.UserInfo
	createUserDataErr              error

	getInterestsCodes  []string
	getInterestsResult []int64
	getInterestsErr    error

	createUserInterestsUserID int64
	createUserInterestsIDs    []int64
	createUserInterestsErr    error

	updatePasswordUserID   int64
	updatePasswordPassword string
	updatePasswordErr      error
}

func (r *userRepositoryFake) Get(context.Context, int64) (*domain.User, error) {
	return r.getUser, r.getErr
}

func (r *userRepositoryFake) GetByTelegramId(context.Context, int64) (*domain.User, error) {
	panic("unexpected call")
}

func (r *userRepositoryFake) GetByEmail(context.Context, string) (*domain.User, error) {
	panic("unexpected call")
}

func (r *userRepositoryFake) GetInterestsByCodes(_ context.Context, interestsCodes []string) ([]int64, error) {
	r.getInterestsCodes = append([]string(nil), interestsCodes...)
	return r.getInterestsResult, r.getInterestsErr
}

func (r *userRepositoryFake) CreateUserData(_ context.Context, userId int64, telegramUsername string, userInfo *domain.UserInfo) error {
	r.createUserDataID = userId
	r.createUserDataTelegramUsername = telegramUsername
	r.createUserDataInfo = userInfo
	return r.createUserDataErr
}

func (r *userRepositoryFake) Create(_ context.Context, user *domain.User) (int64, error) {
	r.createUser = user
	return r.createID, r.createErr
}

func (r *userRepositoryFake) CreateUserInterests(_ context.Context, userId int64, interestsIds []int64) error {
	r.createUserInterestsUserID = userId
	r.createUserInterestsIDs = append([]int64(nil), interestsIds...)
	return r.createUserInterestsErr
}

func (r *userRepositoryFake) Update(context.Context, int64, *domain.UpdateUser) error {
	panic("unexpected call")
}

func (r *userRepositoryFake) UpdatePassword(_ context.Context, userId int64, password string) error {
	r.updatePasswordUserID = userId
	r.updatePasswordPassword = password
	return r.updatePasswordErr
}

func (r *userRepositoryFake) Delete(context.Context, int64) error {
	panic("unexpected call")
}

func TestCreateHashesPasswordAndPersistsUserData(t *testing.T) {
	t.Parallel()

	email := "user@example.com"
	telegramID := int64(123)
	input := &dto.CreateUser{
		Name:             "Dmitry",
		Email:            &email,
		TelegramId:       &telegramID,
		TelegramUsername: "mist",
		City:             "Tbilisi",
		Country:          "Georgia",
		Language:         "ru",
		Interests:        []string{"music", "sport"},
		Password:         "plain-password",
	}
	repo := &userRepositoryFake{
		createID:           777,
		getInterestsResult: []int64{10, 20},
	}
	txManager := &txManagerFake{}
	svc := NewUserService(repo, txManager)

	id, err := svc.Create(context.Background(), input)
	if err != nil {
		t.Fatalf("Create() error = %v", err)
	}

	if id != 777 {
		t.Fatalf("Create() id = %d, want 777", id)
	}
	if txManager.calls != 1 {
		t.Fatalf("ReadCommitted() calls = %d, want 1", txManager.calls)
	}
	if repo.createUser == nil {
		t.Fatalf("repository Create() was not called")
	}
	if repo.createUser.Password == "plain-password" {
		t.Fatalf("password was stored without hashing")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(repo.createUser.Password), []byte("plain-password")); err != nil {
		t.Fatalf("stored password hash does not match original password: %v", err)
	}
	if input.Password == "plain-password" {
		t.Fatalf("input password was not replaced with hash")
	}
	if repo.createUserDataID != 777 {
		t.Fatalf("CreateUserData() userId = %d, want 777", repo.createUserDataID)
	}
	if repo.createUserDataTelegramUsername != "mist" {
		t.Fatalf("CreateUserData() telegram username = %q, want mist", repo.createUserDataTelegramUsername)
	}
	if repo.createUserDataInfo == nil || repo.createUserDataInfo.Name != "Dmitry" {
		t.Fatalf("CreateUserData() info = %#v, want user info", repo.createUserDataInfo)
	}
	if !reflect.DeepEqual(repo.getInterestsCodes, []string{"music", "sport"}) {
		t.Fatalf("GetInterestsByCodes() codes = %v, want [music sport]", repo.getInterestsCodes)
	}
	if repo.createUserInterestsUserID != 777 {
		t.Fatalf("CreateUserInterests() userId = %d, want 777", repo.createUserInterestsUserID)
	}
	if !reflect.DeepEqual(repo.createUserInterestsIDs, []int64{10, 20}) {
		t.Fatalf("CreateUserInterests() ids = %v, want [10 20]", repo.createUserInterestsIDs)
	}
}

func TestCreateReturnsTransactionError(t *testing.T) {
	t.Parallel()

	expectedErr := errors.New("transaction failed")
	repo := &userRepositoryFake{}
	svc := NewUserService(repo, &txManagerFake{err: expectedErr})

	id, err := svc.Create(context.Background(), &dto.CreateUser{Password: "plain-password"})
	if !errors.Is(err, expectedErr) {
		t.Fatalf("Create() error = %v, want %v", err, expectedErr)
	}
	if id != 0 {
		t.Fatalf("Create() id = %d, want 0", id)
	}
	if repo.createUser != nil {
		t.Fatalf("repository Create() was called after transaction error")
	}
}

func TestUpdatePasswordRejectsIncorrectOldPassword(t *testing.T) {
	t.Parallel()

	oldHash, err := bcrypt.GenerateFromPassword([]byte("old-password"), bcrypt.DefaultCost)
	if err != nil {
		t.Fatalf("GenerateFromPassword() error = %v", err)
	}
	repo := &userRepositoryFake{
		getUser: &domain.User{Password: string(oldHash)},
	}
	svc := NewUserService(repo, &txManagerFake{})

	err = svc.UpdatePassword(context.Background(), 777, &dto.UpdatePassword{
		OldPassword: "wrong-password",
		NewPassword: "new-password",
	})
	if !errors.Is(err, domain.ErrIncorrectOldPassword) {
		t.Fatalf("UpdatePassword() error = %v, want %v", err, domain.ErrIncorrectOldPassword)
	}
	if repo.updatePasswordPassword != "" {
		t.Fatalf("UpdatePassword() repository update was called")
	}
}

func TestUpdatePasswordStoresHashedNewPassword(t *testing.T) {
	t.Parallel()

	oldHash, err := bcrypt.GenerateFromPassword([]byte("old-password"), bcrypt.DefaultCost)
	if err != nil {
		t.Fatalf("GenerateFromPassword() error = %v", err)
	}
	repo := &userRepositoryFake{
		getUser: &domain.User{Password: string(oldHash)},
	}
	svc := NewUserService(repo, &txManagerFake{})

	err = svc.UpdatePassword(context.Background(), 777, &dto.UpdatePassword{
		OldPassword: "old-password",
		NewPassword: "new-password",
	})
	if err != nil {
		t.Fatalf("UpdatePassword() error = %v", err)
	}

	if repo.updatePasswordUserID != 777 {
		t.Fatalf("UpdatePassword() userId = %d, want 777", repo.updatePasswordUserID)
	}
	if repo.updatePasswordPassword == "new-password" {
		t.Fatalf("new password was stored without hashing")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(repo.updatePasswordPassword), []byte("new-password")); err != nil {
		t.Fatalf("stored new password hash does not match new password: %v", err)
	}
}
