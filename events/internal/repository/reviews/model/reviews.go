package model

import "time"

type MediaAttachment struct {
	Type string `db:"type"`
	Key  string `db:"key"`
}

type Review struct {
	AuthorId      int64              `db:"author_id"`
	Grade         int                `db:"grade"`
	Advantages    string             `db:"advantages"`
	Disadvantages string             `db:"disadvantages"`
	Text          string             `db:"text"`
	Media         []*MediaAttachment `db:"media_files"`
	CreatedAt     time.Time          `db:"created_at"`
}
