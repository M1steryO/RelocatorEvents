package model

import "time"

type MediaAttachment struct {
	StorageKey string `db:"storage_key"`
	Type       string `db:"media_type"`
}

type Review struct {
	AuthorId      int64              `db:"author_id"`
	Grade         int                `db:"grade"`
	Advantages    string             `db:"advantages"`
	Disadvantages string             `db:"disadvantages"`
	Text          string             `db:"text"`
	Media         []*MediaAttachment `db:"media"`
	CreatedAt     time.Time          `db:"created_at"`
}
