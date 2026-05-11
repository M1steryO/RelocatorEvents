package middleware

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/M1steryO/RelocatorEvents/gateway/internal/domain/auth"
	"github.com/M1steryO/RelocatorEvents/gateway/internal/domain/user"
	"github.com/M1steryO/RelocatorEvents/gateway/internal/logger"
)

func TestMain(m *testing.M) {
	logger.Init("test")
	os.Exit(m.Run())
}

type authClientFake struct {
	checkAccessToken  string
	checkRefreshToken string
	checkInitData     string
	checkResponse     *auth.AuthData
	checkErr          error
}

func (c *authClientFake) GetRefreshToken(context.Context, string) (string, error) {
	panic("unexpected call")
}

func (c *authClientFake) GetAccessToken(context.Context, string) (auth.AuthData, error) {
	panic("unexpected call")
}

func (c *authClientFake) TelegramLogin(context.Context, int64) (auth.AuthData, error) {
	panic("unexpected call")
}

func (c *authClientFake) Check(_ context.Context, accessToken, refreshToken, initData string) (*auth.AuthData, error) {
	c.checkAccessToken = accessToken
	c.checkRefreshToken = refreshToken
	c.checkInitData = initData
	return c.checkResponse, c.checkErr
}

type userClientFake struct{}

func (c *userClientFake) GetUserByTelegramId(context.Context, int64) (*user.User, error) {
	panic("unexpected call")
}

func TestRequireAuthRejectsMissingCredentials(t *testing.T) {
	t.Parallel()

	authClient := &authClientFake{}
	middleware := NewAuthMiddleware(authClient)
	nextCalled := false
	handler := middleware.RequireAuth(http.HandlerFunc(func(http.ResponseWriter, *http.Request) {
		nextCalled = true
	}))

	req := httptest.NewRequest(http.MethodGet, "/events", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusUnauthorized)
	}
	if nextCalled {
		t.Fatalf("next handler was called")
	}
	if authClient.checkAccessToken != "" || authClient.checkRefreshToken != "" || authClient.checkInitData != "" {
		t.Fatalf("auth Check() was called for request without credentials")
	}
}

func TestRequireAuthForwardsAuthenticatedUserAndRotatedTokens(t *testing.T) {
	t.Parallel()

	authClient := &authClientFake{
		checkResponse: &auth.AuthData{
			UserId:       777,
			AccessToken:  "new-access",
			RefreshToken: "new-refresh",
		},
	}
	middleware := NewAuthMiddleware(authClient)
	var gotUserID any
	handler := middleware.RequireAuth(http.HandlerFunc(func(_ http.ResponseWriter, r *http.Request) {
		gotUserID = r.Context().Value(CtxUserIdKey)
	}))

	req := httptest.NewRequest(http.MethodGet, "/events", nil)
	req.Header.Set("Authorization", "Bearer old-access")
	req.AddCookie(&http.Cookie{Name: "refresh_token", Value: "old-refresh"})
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusOK)
	}
	if authClient.checkAccessToken != "old-access" {
		t.Fatalf("Check() access token = %q, want old-access", authClient.checkAccessToken)
	}
	if authClient.checkRefreshToken != "old-refresh" {
		t.Fatalf("Check() refresh token = %q, want old-refresh", authClient.checkRefreshToken)
	}
	if gotUserID != int64(777) {
		t.Fatalf("context user id = %#v, want 777", gotUserID)
	}
	if rec.Header().Get("Authorization") != "Bearer new-access" {
		t.Fatalf("Authorization header = %q, want Bearer new-access", rec.Header().Get("Authorization"))
	}
	if cookies := rec.Result().Cookies(); len(cookies) != 1 || cookies[0].Name != "refresh_token" || cookies[0].Value != "new-refresh" {
		t.Fatalf("cookies = %#v, want rotated refresh_token", cookies)
	}
}

func TestRequireAuthRejectsAuthClientError(t *testing.T) {
	t.Parallel()

	authClient := &authClientFake{
		checkErr: errors.New("invalid token"),
	}
	middleware := NewAuthMiddleware(authClient)
	nextCalled := false
	handler := middleware.RequireAuth(http.HandlerFunc(func(http.ResponseWriter, *http.Request) {
		nextCalled = true
	}))

	req := httptest.NewRequest(http.MethodGet, "/events", nil)
	req.Header.Set("Authorization", "Bearer bad-access")
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusUnauthorized)
	}
	if nextCalled {
		t.Fatalf("next handler was called")
	}
	if authClient.checkAccessToken != "bad-access" {
		t.Fatalf("Check() access token = %q, want bad-access", authClient.checkAccessToken)
	}
}
