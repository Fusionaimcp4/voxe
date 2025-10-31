#!/bin/bash

# Check if port 5433 is available for Docker PostgreSQL

echo "🔍 Checking if port 5433 is available..."

if lsof -i :5433 >/dev/null 2>&1; then
    echo "❌ Port 5433 is already in use!"
    echo "Processes using port 5433:"
    lsof -i :5433
    echo ""
    echo "Please stop the process using port 5433 or choose a different port."
    exit 1
else
    echo "✅ Port 5433 is available!"
    echo "✅ Docker PostgreSQL can use port 5433"
fi

echo ""
echo "📊 Current PostgreSQL usage:"
echo "Port 5432 (existing):"
lsof -i :5432 2>/dev/null || echo "No processes on port 5432"
echo ""
echo "Port 5433 (Docker):"
lsof -i :5433 2>/dev/null || echo "No processes on port 5433"
