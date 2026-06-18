-- Migration: Add missing user roles
-- Date: 2026-01-17
-- Description: Add KURIKULUM, SEKRETARIS, and SUPER_ADMIN roles with test users

-- Step 1: Create users with proper password hash (password: "password123")
-- Using bcrypt hash for "password123": $2a$10$41lVIO1qpMlx.EMEeZ5dee3ayZdkniUF0UVrXQRjGRfyAfNSmB4aK

-- Add KURIKULUM user
INSERT INTO users (email, full_name, nim, password_hash)
VALUES ('kurikulum@mrt.ac.id', 'Admin Kurikulum', 'ADM001', '$2a$10$41lVIO1qpMlx.EMEeZ5dee3ayZdkniUF0UVrXQRjGRfyAfNSmB4aK')
ON CONFLICT (email) DO NOTHING;

-- Add SEKRETARIS user
INSERT INTO users (email, full_name, nim, password_hash)
VALUES ('sekretaris@mrt.ac.id', 'Sekretaris Akademik', 'ADM002', '$2a$10$41lVIO1qpMlx.EMEeZ5dee3ayZdkniUF0UVrXQRjGRfyAfNSmB4aK')
ON CONFLICT (email) DO NOTHING;

-- Add SUPER_ADMIN user
INSERT INTO users (email, full_name, nim, password_hash)
VALUES ('superadmin@mrt.ac.id', 'Super Administrator', 'ADM003', '$2a$10$41lVIO1qpMlx.EMEeZ5dee3ayZdkniUF0UVrXQRjGRfyAfNSmB4aK')
ON CONFLICT (email) DO NOTHING;

-- Step 2: Assign roles to users
INSERT INTO user_roles (user_id, role)
SELECT id, 'KURIKULUM' FROM users WHERE email = 'kurikulum@mrt.ac.id'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO user_roles (user_id, role)
SELECT id, 'SEKRETARIS' FROM users WHERE email = 'sekretaris@mrt.ac.id'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO user_roles (user_id, role)
SELECT id, 'SUPER_ADMIN' FROM users WHERE email = 'superadmin@mrt.ac.id'
ON CONFLICT (user_id, role) DO NOTHING;
