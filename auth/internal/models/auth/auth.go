package auth

type UserInfo struct {
	Id   int64  `json:"id"`
	Role string `json:"role"`
}

type Credentials struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	InitData     string `json:"init_data"`
	UserId       int64  `json:"user_id"`
}
