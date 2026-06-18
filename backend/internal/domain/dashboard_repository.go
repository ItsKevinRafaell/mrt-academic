package domain

type DashboardRepository interface {
	GetSummary(userID string) (*DashboardSummary, error)
}
