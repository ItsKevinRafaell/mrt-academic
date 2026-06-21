-- Migration: Convert roles from lowercase to UPPERCASE
-- This migration updates the CHECK constraint and existing data

-- Step 1: Drop the existing CHECK constraint
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;

-- Step 2: Update existing data from lowercase to UPPERCASE
UPDATE user_roles SET role = 'MAHASISWA' WHERE role = 'mahasiswa';
UPDATE user_roles SET role = 'KURIKULUM' WHERE role = 'kurikulum';
UPDATE user_roles SET role = 'SEKRETARIS' WHERE role = 'sekretaris';
UPDATE user_roles SET role = 'KOMTI' WHERE role = 'komti';
UPDATE user_roles SET role = 'WAKOMTI' WHERE role = 'wakomti';
UPDATE user_roles SET role = 'SUPER_ADMIN' WHERE role = 'super_admin';

-- Step 3: Add new CHECK constraint with UPPERCASE values
ALTER TABLE user_roles ADD CONSTRAINT user_roles_role_check
  CHECK (role IN ('MAHASISWA', 'KURIKULUM', 'SEKRETARIS', 'KOMTI', 'WAKOMTI', 'SUPER_ADMIN'));
