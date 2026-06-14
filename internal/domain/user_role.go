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
}

const (
	RoleMahasiswa   = "mahasiswa"
	RoleKurikulum   = "kurikulum"
	RoleSekretaris  = "sekretaris"
	RoleKomti       = "komti"
	RoleWakomti     = "wakomti"
	RoleSuperAdmin  = "super_admin"
)

var AdminRoles = []string{RoleKurikulum, RoleSekretaris, RoleKomti, RoleWakomti, RoleSuperAdmin}
