#!/bin/bash
# Test script for all MRT API endpoints
# Usage: ./scripts/test/test-api.sh [base_url]

BASE_URL="${1:-http://localhost:9090}"
TOKEN=""

echo "=========================================="
echo "MRT API Test Suite"
echo "Base URL: $BASE_URL"
echo "=========================================="
echo ""

# Health check
echo "1. Health Check"
curl -s "$BASE_URL/api/health" | jq '.'
echo ""

# Auth - Register
echo "2. Register New User"
curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "nim": "12345678",
    "full_name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }' | jq '.'
echo ""

# Auth - Login
echo "3. Login"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "admin123"
  }')
echo "$LOGIN_RESPONSE" | jq '.'
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token')
echo "Token: ${TOKEN:0:50}..."
echo ""

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "Login failed. Aborting tests."
  exit 1
fi

# Auth - Get Current User
echo "4. Get Current User"
curl -s "$BASE_URL/api/users/me" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# Courses - Get All
echo "5. Get All Courses"
curl -s "$BASE_URL/api/courses" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# Courses - Get By ID
echo "6. Get Course By ID (ID: 1)"
curl -s "$BASE_URL/api/courses/1" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# Courses - Create (admin only)
echo "7. Create Course (admin only)"
curl -s -X POST "$BASE_URL/api/courses" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "CS101",
    "name": "Struktur Data",
    "sks": 3,
    "description": "Fundamental data structures"
  }' | jq '.'
echo ""

# Sessions - Get By Course
echo "8. Get Sessions By Course (Course ID: 1)"
curl -s "$BASE_URL/api/courses/1/sessions" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# Sessions - Create (admin only)
echo "9. Create Session (admin only)"
curl -s -X POST "$BASE_URL/api/courses/1/sessions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "number": 1,
    "title": "Introduction to OOP"
  }' | jq '.'
echo ""

# Materials - Get By Course
echo "10. Get Materials By Course (Course ID: 1)"
curl -s "$BASE_URL/api/courses/1/materials" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# Materials - Create (admin only)
echo "11. Create Material (admin only)"
curl -s -X POST "$BASE_URL/api/materials" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": 1,
    "title": "Lecture Notes",
    "type": "pdf",
    "url": "https://example.com/notes.pdf"
  }' | jq '.'
echo ""

# Tasks - Get By Course
echo "12. Get Tasks By Course (Course ID: 1)"
curl -s "$BASE_URL/api/courses/1/tasks" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# Tasks - Create (admin only)
echo "13. Create Task (admin only)"
curl -s -X POST "$BASE_URL/api/courses/1/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Assignment 1",
    "description": "Complete exercises 1-10",
    "deadline": "2026-12-31T23:59:59Z"
  }' | jq '.'
echo ""

# Tasks - Update Progress
echo "14. Update Task Progress (Task ID: 1)"
curl -s -X PATCH "$BASE_URL/api/tasks/1/progress" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "completed": true
  }' | jq '.'
echo ""

# Grades - Get User Grades
echo "15. Get User Grades"
curl -s "$BASE_URL/api/grades" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# Grades - Create/Update
echo "16. Create/Update Grade"
curl -s -X POST "$BASE_URL/api/grades" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "course_id": 1,
    "grade": "A"
  }' | jq '.'
echo ""

# Grades - Calculate GPA
echo "17. Calculate GPA"
curl -s "$BASE_URL/api/grades/gpa" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# Events - Get All
echo "18. Get All Events"
curl -s "$BASE_URL/api/events" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# Events - Create (admin only)
echo "19. Create Event (admin only)"
curl -s -X POST "$BASE_URL/api/events" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "UAS",
    "description": "Ujian Akhir Semester",
    "event_date": "2026-12-15T00:00:00Z",
    "event_type": "exam"
  }' | jq '.'
echo ""

# Events - Get Upcoming
echo "20. Get Upcoming Events"
curl -s "$BASE_URL/api/events/upcoming" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# Dashboard - Get Summary
echo "21. Get Dashboard Summary"
curl -s "$BASE_URL/api/dashboard/summary" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# Search - Get Index
echo "22. Get Search Index"
curl -s "$BASE_URL/api/search/index" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.courses | length'
echo " courses indexed"
echo ""

# Search - Query
echo "23. Search Query (query: 'data')"
curl -s "$BASE_URL/api/search?q=data" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

echo "=========================================="
echo "Test suite completed!"
echo "=========================================="
