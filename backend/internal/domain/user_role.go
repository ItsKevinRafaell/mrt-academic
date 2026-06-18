package domain

import "time"

type UserRole struct {
	UserID     string    `json:"user_id"`
	Role       string    `json:"role"`
	AssignedAt time.Time `json:"assigned_at"`
}

type UserRoleRepository interface {
	Assign(userRole *UserRole) error
	GetByUserID(userID string) ([]UserRole, error)
	GetPrimaryRole(userID string) (string, error)
	UpdateUserRole(userRole *UserRole) error
}

const (
	RoleMahasiswa   = "MAHASISWA"
	RoleKurikulum   = "KURIKULUM"
	RoleSekretaris  = "SEKRETARIS"
	RoleKomti       = "KOMTI"
	RoleWakomti     = "WAKOMTI"
	RoleSuperAdmin  = "SUPER_ADMIN"
)

var AdminRoles = []string{RoleKurikulum, RoleSekretaris, RoleKomti, RoleWakomti, RoleSuperAdmin}
