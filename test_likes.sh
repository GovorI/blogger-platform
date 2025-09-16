#!/usr/bin/env bash

# Set up environment
export NODE_ENV=testing
export IS_USER_AUTOMATICALLY_CONFIRMED=true

# Base URL
BASE_URL="http://localhost:3000/api"

echo "🧪 Testing Like Functionality"
echo "================================="

# 1. Clear database
echo "1. Clearing database..."
curl -s -X DELETE "$BASE_URL/testing/all-data" -w "\nStatus: %{http_code}\n\n"

# 2. Register user
echo "2. Registering user..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/registration" \
  -H "Content-Type: application/json" \
  -d '{
    "login": "testuser123",
    "password": "password123",
    "email": "test@example.com"
  }' -w "\nStatus: %{http_code}")
echo "$REGISTER_RESPONSE"
echo ""

# 3. Login
echo "3. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "loginOrEmail": "testuser123",
    "password": "password123"
  }')
echo "$LOGIN_RESPONSE"

ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')
echo "Access Token: $ACCESS_TOKEN"
echo ""

# 4. Create blog
echo "4. Creating blog..."
BLOG_RESPONSE=$(curl -s -X POST "$BASE_URL/blogs" \
  -u "admin:qwerty" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Blog",
    "description": "A test blog",
    "websiteUrl": "https://example.com"
  }')
echo "$BLOG_RESPONSE"

BLOG_ID=$(echo $BLOG_RESPONSE | grep -o '"id":"[^"]*' | sed 's/"id":"//')
echo "Blog ID: $BLOG_ID"
echo ""

# 5. Create post
echo "5. Creating post..."
POST_RESPONSE=$(curl -s -X POST "$BASE_URL/posts" \
  -u "admin:qwerty" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Test Post\",
    \"shortDescription\": \"A test post\",
    \"content\": \"This is test content\",
    \"blogId\": \"$BLOG_ID\"
  }")
echo "$POST_RESPONSE"

POST_ID=$(echo $POST_RESPONSE | grep -o '"id":"[^"]*' | sed 's/"id":"//')
echo "Post ID: $POST_ID"
echo ""

# 6. Get post before like (anonymous)
echo "6. Getting post before like (anonymous)..."
GET_BEFORE_RESPONSE=$(curl -s -X GET "$BASE_URL/posts/$POST_ID")
echo "$GET_BEFORE_RESPONSE"
echo ""

# 7. Like the post
echo "7. Liking the post..."
LIKE_RESPONSE=$(curl -s -X PUT "$BASE_URL/posts/$POST_ID/like-status" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "likeStatus": "Like"
  }' -w "\nStatus: %{http_code}")
echo "$LIKE_RESPONSE"
echo ""

# 8. Get post after like (authenticated)
echo "8. Getting post after like (authenticated)..."
GET_AFTER_RESPONSE=$(curl -s -X GET "$BASE_URL/posts/$POST_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN")
echo "$GET_AFTER_RESPONSE"
echo ""

echo "✅ Test completed!"