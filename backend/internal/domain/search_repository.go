package domain

type SearchRepository interface {
	GetIndex() (*SearchIndex, error)
	Search(query string) (*SearchIndex, error)
	RebuildCache() error
}
