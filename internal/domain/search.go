package domain

import "time"

type SearchItem struct {
	ID          int    `json:"id"`
	Type        string `json:"type"`
	Title       string `json:"title"`
	Description string `json:"description"`
}

type SearchIndex struct {
	Courses  []SearchItem `json:"courses"`
	Sessions []SearchItem `json:"sessions"`
	Tasks    []SearchItem `json:"tasks"`
}

type SearchCache struct {
	Data        *SearchIndex
	LastUpdated time.Time
}
