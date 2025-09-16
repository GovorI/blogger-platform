#!/bin/bash

# Простой тест для проверки работы нового механизма токенов
echo "🧪 Тестирование работы токенов в тестовом окружении"
echo "=================================================="

BASE_URL="http://localhost:3000/api"

# 1. Очистка базы данных
echo "1. Очистка базы данных..."
curl -s -X DELETE "$BASE_URL/testing/all-data" -w "\nStatus: %{http_code}\n\n"

# 2. Регистрация пользователя
echo "2. Регистрация пользователя..."
curl -s -X POST "$BASE_URL/auth/registration" \
  -H "Content-Type: application/json" \
  -d '{
    "login": "testuser",
    "password": "password123",
    "email": "test@example.com"
  }' -w "\nStatus: %{http_code}\n\n"

# 3. Логин
echo "3. Логин пользователя..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "loginOrEmail": "testuser",
    "password": "password123"
  }' -c cookies.txt -w "\nSTATUS:%{http_code}")

echo "$LOGIN_RESPONSE"
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')
echo ""
echo "Access Token получен: ${ACCESS_TOKEN:0:50}..."

# 4. Проверка /auth/me сразу после логина
echo ""
echo "4. Проверка /auth/me сразу после логина..."
curl -s -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -w "\nStatus: %{http_code}\n\n"

# 5. Ждем 11 секунд и проверяем снова (access token должен истечь)
echo "5. Ждем 11 секунд и проверяем /auth/me (access token должен истечь)..."
sleep 11
curl -s -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -w "\nStatus: %{http_code}\n\n"

# 6. Проверяем refresh-token (должен работать в течение 20 секунд)
echo "6. Проверяем refresh-token..."
REFRESH_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/refresh-token" \
  -b cookies.txt -c new_cookies.txt -w "\nSTATUS:%{http_code}")

echo "$REFRESH_RESPONSE"
NEW_ACCESS_TOKEN=$(echo "$REFRESH_RESPONSE" | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')
echo ""
echo "Новый Access Token получен: ${NEW_ACCESS_TOKEN:0:50}..."

# 7. Проверяем /auth/me с новым токеном
echo ""
echo "7. Проверяем /auth/me с новым токеном..."
curl -s -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $NEW_ACCESS_TOKEN" \
  -w "\nStatus: %{http_code}\n\n"

# 8. Ждем еще 10 секунд (всего 21 секунда) и проверяем refresh-token (должен истечь)
echo "8. Ждем еще 10+ секунд и проверяем refresh-token (должен истечь)..."
sleep 10
curl -s -X POST "$BASE_URL/auth/refresh-token" \
  -b new_cookies.txt -w "\nStatus: %{http_code}\n\n"

echo "Тест завершен!"