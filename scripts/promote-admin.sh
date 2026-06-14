#!/bin/bash

EMAIL=$1

if [ -z "$EMAIL" ]; then
  echo "Usage: $0 <email>"
  echo "Example: $0 admin@test.com"
  exit 1
fi

echo "Promoting $EMAIL to super_admin..."

sg docker -c "docker exec -i mrt-postgres psql -U mrt -d mrt_db" <<EOF
UPDATE user_roles
SET role = 'super_admin'
WHERE user_id = (SELECT id FROM users WHERE email = '$EMAIL')
  AND role = 'mahasiswa';

SELECT u.email, ur.role
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = '$EMAIL';
EOF

echo "Done!"
