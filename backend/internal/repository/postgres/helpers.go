package postgres

import (
	"database/sql"
	"time"
)

func NullStringToString(ns sql.NullString) string {
	if ns.Valid {
		return ns.String
	}
	return ""
}

func NullInt64ToInt(ns sql.NullInt64) int {
	if ns.Valid {
		return int(ns.Int64)
	}
	return 0
}

func NullInt64ToPtr(ns sql.NullInt64) *int {
	if ns.Valid {
		val := int(ns.Int64)
		return &val
	}
	return nil
}

func NullStringToPtr(ns sql.NullString) *string {
	if ns.Valid {
		return &ns.String
	}
	return nil
}

func NullTimeToPtr(ns sql.NullTime) *time.Time {
	if ns.Valid {
		return &ns.Time
	}
	return nil
}

func IntToNullInt64(val int) sql.NullInt64 {
	return sql.NullInt64{Int64: int64(val), Valid: val != 0}
}

func StringToNullString(val string) sql.NullString {
	return sql.NullString{String: val, Valid: val != ""}
}

func PtrToNullInt64(val *int) sql.NullInt64 {
	if val != nil {
		return sql.NullInt64{Int64: int64(*val), Valid: true}
	}
	return sql.NullInt64{}
}

func PtrToNullString(val *string) sql.NullString {
	if val != nil {
		return sql.NullString{String: *val, Valid: true}
	}
	return sql.NullString{}
}
