package auth

type AuthData struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	UserId       int64  `json:"user_id"`
}
