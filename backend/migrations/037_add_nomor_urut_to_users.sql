-- Migration: 037_add_nomor_urut_to_users.sql
-- Description: Add nomor_urut field to users table
-- Created: 2026-06-30

ALTER TABLE users ADD COLUMN nomor_urut INTEGER UNIQUE;
