package telegram

import (
	"crypto/ed25519"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"net/url"
	"sort"
	"strconv"
	"strings"
	"time"
)

// =======================
// Errors
// =======================

var (
	ErrExpiredInitData = errors.New("init data expired")
)

type InvalidInitDataError struct {
	Msg string
}

func (e InvalidInitDataError) Error() string {
	if e.Msg == "" {
		return "invalid init data"
	}
	return "invalid init data: " + e.Msg
}

// =======================
// Data models (примерно как в python)
// =======================

type WebAppUser struct {
	ID              int64  `json:"id"`
	FirstName       string `json:"first_name"`
	LastName        string `json:"last_name,omitempty"`
	Username        string `json:"username,omitempty"`
	LanguageCode    string `json:"language_code,omitempty"`
	IsPremium       bool   `json:"is_premium,omitempty"`
	PhotoURL        string `json:"photo_url,omitempty"`
	AllowsWriteToPm bool   `json:"allows_write_to_pm,omitempty"`
}

type WebAppChat struct {
	ID    int64  `json:"id"`
	Type  string `json:"type,omitempty"`
	Title string `json:"title,omitempty"`
	// добавь поля при необходимости
}

type WebAppInitData struct {
	QueryID      string      `json:"query_id,omitempty"`
	User         *WebAppUser `json:"user,omitempty"`
	Receiver     *WebAppUser `json:"receiver,omitempty"`
	Chat         *WebAppChat `json:"chat,omitempty"`
	ChatType     string      `json:"chat_type,omitempty"`
	ChatInst     string      `json:"chat_instance,omitempty"`
	StartParam   string      `json:"start_param,omitempty"`
	CanSendAfter int64       `json:"can_send_after,omitempty"`

	AuthDate  string `json:"auth_date,omitempty"`
	Hash      string `json:"hash,omitempty"`
	Signature string `json:"signature,omitempty"`

	// Все остальные поля, чтобы ничего не терять:
	Raw map[string]string `json:"-"`
}

// =======================
// Public keys (Third-party use)
// =======================

// TODO: подставь реальные 32-байтные public keys Ed25519.
// В python они приходят из telegram_webapp_auth.data как Ed25519PublicKey.
//
// var ProdPublicKey = ed25519.PublicKey{...32 bytes...}
// var TestPublicKey = ed25519.PublicKey{...32 bytes...}

var (
	ProdPublicKey ed25519.PublicKey
	TestPublicKey ed25519.PublicKey
)

// =======================
// Secret key generation
// =======================

// GenerateSecretKey генерит secret key из Bot Token по доке Telegram.
// key = "WebAppData", msg = token, algo = HMAC-SHA256
func GenerateSecretKey(token string) []byte {
	mac := hmac.New(sha256.New, []byte("WebAppData"))
	_, _ = mac.Write([]byte(token))
	return mac.Sum(nil)
}

// =======================
// Authenticator
// =======================

type TelegramAuthenticator struct {
	secret []byte
}

func NewTelegramAuthenticator(secret []byte) *TelegramAuthenticator {
	return &TelegramAuthenticator{secret: secret}
}

// Validate — стандартная проверка init_data через hash (HMAC-SHA256).
// expiry = 0 => не проверять срок годности.
func (a *TelegramAuthenticator) Validate(initData string, expiry time.Duration) (*WebAppInitData, error) {
	initData, err := url.QueryUnescape(initData)
	if err != nil {
		return nil, InvalidInitDataError{Msg: "cannot unescape init data"}
	}

	m, err := parseInitData(initData)
	if err != nil {
		return nil, err
	}

	hashVal := strings.TrimSpace(m["hash"])
	if hashVal == "" {
		return nil, InvalidInitDataError{Msg: "init data does not contain hash"}
	}

	authDate := m["auth_date"]
	if err := checkExpiry(authDate, expiry); err != nil {
		return nil, err
	}

	dataCheckString := buildDataCheckString(m, map[string]bool{"hash": true})

	if !a.validateHash(hashVal, dataCheckString) {
		return nil, InvalidInitDataError{Msg: "invalid data"}
	}

	return serializeInitData(m)
}

// ValidateThirdParty — проверка init_data для third-party use через signature (Ed25519).
// botID обязателен.
// expiry = 0 => не проверять срок годности.
// isTest=true => использовать TestPublicKey, иначе ProdPublicKey.
func (a *TelegramAuthenticator) ValidateThirdParty(initData string, botID int64, expiry time.Duration, isTest bool) (*WebAppInitData, error) {
	initData, err := url.QueryUnescape(initData)
	if err != nil {
		return nil, InvalidInitDataError{Msg: "cannot unescape init data"}
	}

	m, err := parseInitData(initData)
	if err != nil {
		return nil, err
	}

	authDate := m["auth_date"]
	if err := checkExpiry(authDate, expiry); err != nil {
		return nil, err
	}

	signature := strings.TrimSpace(m["signature"])
	if signature == "" {
		return nil, InvalidInitDataError{Msg: "init data does not contain signature"}
	}

	dcs := buildDataCheckString(m, map[string]bool{"hash": true, "signature": true})
	message := fmt.Sprintf("%d:WebAppData\n%s", botID, dcs)

	sigBytes, err := decodeSignature(signature)
	if err != nil {
		return nil, err
	}

	var pub ed25519.PublicKey
	if isTest {
		pub = TestPublicKey
	} else {
		pub = ProdPublicKey
	}
	if len(pub) != ed25519.PublicKeySize {
		return nil, InvalidInitDataError{Msg: "public key is not set or has invalid length"}
	}

	if !ed25519.Verify(pub, sigBytes, []byte(message)) {
		return nil, InvalidInitDataError{Msg: "invalid data"}
	}

	return serializeInitData(m)
}

// =======================
// internals
// =======================

func parseInitData(data string) (map[string]string, error) {
	if strings.TrimSpace(data) == "" {
		return nil, InvalidInitDataError{Msg: "init data cannot be empty"}
	}

	// ParseQuery expects "a=b&c=d"
	q, err := url.ParseQuery(data)
	if err != nil {
		return nil, InvalidInitDataError{Msg: "cannot parse init data"}
	}

	m := make(map[string]string, len(q))
	for k, vals := range q {
		if len(vals) > 0 {
			m[k] = vals[0]
		} else {
			m[k] = ""
		}
	}
	return m, nil
}

func parseJSONUnquote(raw string, dst any) error {
	// В python: json.loads(unquote(data))
	s, err := url.QueryUnescape(raw)
	if err != nil {
		return InvalidInitDataError{Msg: "cannot unescape json field"}
	}
	if err := json.Unmarshal([]byte(s), dst); err != nil {
		return InvalidInitDataError{Msg: "cannot decode init data json"}
	}
	return nil
}

func buildDataCheckString(m map[string]string, exclude map[string]bool) string {
	keys := make([]string, 0, len(m))
	for k := range m {
		if exclude[k] {
			continue
		}
		keys = append(keys, k)
	}
	sort.Strings(keys)

	lines := make([]string, 0, len(keys))
	for _, k := range keys {
		lines = append(lines, k+"="+m[k])
	}
	return strings.Join(lines, "\n")
}

func (a *TelegramAuthenticator) validateHash(hashHex, dataCheckString string) bool {
	mac := hmac.New(sha256.New, a.secret)
	mac.Write([]byte(dataCheckString))
	sum := mac.Sum(nil)

	want, err := hex.DecodeString(strings.TrimSpace(hashHex))
	if err != nil {
		return false
	}

	return hmac.Equal(sum, want)
}

func checkExpiry(authDate string, expiry time.Duration) error {
	if strings.TrimSpace(authDate) == "" {
		return InvalidInitDataError{Msg: "init data does not contain auth_date"}
	}

	// python: datetime.fromtimestamp(float(auth_date), tz=UTC)
	f, err := strconv.ParseFloat(authDate, 64)
	if err != nil || math.IsNaN(f) || math.IsInf(f, 0) {
		return InvalidInitDataError{Msg: "invalid auth_date"}
	}
	sec := int64(f)
	authTime := time.Unix(sec, 0).UTC()

	if expiry > 0 {
		now := time.Now().UTC()
		if now.Sub(authTime) > expiry {
			return ErrExpiredInitData
		}
	}
	return nil
}

func decodeSignature(val string) ([]byte, error) {
	// python version: adds "=" padding then urlsafe_b64decode
	// В Go: используем URLEncoding (url-safe base64), предварительно допаддим.
	padded := val + strings.Repeat("=", (4-len(val)%4)%4)

	b, err := base64.URLEncoding.DecodeString(padded)
	if err != nil {
		return nil, InvalidInitDataError{Msg: "signature base64 decode failed"}
	}
	return b, nil
}

func serializeInitData(m map[string]string) (*WebAppInitData, error) {
	out := &WebAppInitData{
		Raw: make(map[string]string, len(m)),
	}
	for k, v := range m {
		out.Raw[k] = v
	}

	// Простые поля (если нужно — добавляй/маппь)
	out.QueryID = m["query_id"]
	out.ChatType = m["chat_type"]
	out.ChatInst = m["chat_instance"]
	out.StartParam = m["start_param"]
	out.AuthDate = m["auth_date"]
	out.Hash = m["hash"]
	out.Signature = m["signature"]

	if v := m["can_send_after"]; v != "" {
		if n, err := strconv.ParseInt(v, 10, 64); err == nil {
			out.CanSendAfter = n
		}
	}

	// user/chat/receiver — JSON в виде urlencoded строки
	if v := m["user"]; v != "" {
		var u WebAppUser
		if err := parseJSONUnquote(v, &u); err != nil {
			return nil, err
		}
		out.User = &u
	}
	if v := m["receiver"]; v != "" {
		var u WebAppUser
		if err := parseJSONUnquote(v, &u); err != nil {
			return nil, err
		}
		out.Receiver = &u
	}
	if v := m["chat"]; v != "" {
		var c WebAppChat
		if err := parseJSONUnquote(v, &c); err != nil {
			return nil, err
		}
		out.Chat = &c
	}

	return out, nil
}
