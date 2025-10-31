#!/bin/bash

# Test database connection script

echo "🧪 Testing database connection..."

# Load environment variables
if [ -f .env ]; then
    source .env
fi

# Use DATABASE_URL from .env or set default
if [ -z "$DATABASE_URL" ]; then
    export DATABASE_URL="postgresql://postgres:${POSTGRES_PASSWORD:-postgres}@localhost:5433/localboxs"
fi

echo "📊 Database URL: $DATABASE_URL"

# Test connection
echo "🔍 Testing Prisma connection..."
npx prisma db pull --print

echo "✅ Database connection test completed!"
