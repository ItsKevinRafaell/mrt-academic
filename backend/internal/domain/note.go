package domain

type Note struct {
	ID        string  `json:"id"`
	UserID    string  `json:"user_id"`
	Title     string  `json:"title"`
	Content   string  `json:"content"`
	CourseID  *int    `json:"course_id"`
	SessionID *int    `json:"session_id"`
	CreatedAt string  `json:"created_at"`
	UpdatedAt string  `json:"updated_at"`
	Tags      []string `json:"tags"`
}

type NoteRepository interface {
	CreateNote(note *Note) error
	GetNoteByID(id string) (*Note, error)
	GetNotesByUser(userID string) ([]Note, error)
	GetNotesBySession(userID string, sessionID int) ([]Note, error)
	GetNotesByCourse(userID string, courseID int) ([]Note, error)
	UpdateNote(note *Note) error
	DeleteNote(id, userID string) error
}

type NoteUseCase interface {
	CreateNote(userID string, title, content string, courseID, sessionID *int, tags []string) (*Note, error)
	GetAllNotes(userID string) ([]Note, error)
	GetNotesBySession(userID string, sessionID int) ([]Note, error)
	UpdateNote(userID string, id string, title, content string, tags []string) (*Note, error)
	DeleteNote(userID, id string) error
}
