#!/bin/bash
# Quick script to check database tables
# Run inside voxe_app container

echo "Checking database tables..."
psql -h postgres -U postgres -d voxe -c "\dt"

echo ""
echo "Checking if 'users' table exists..."
psql -h postgres -U postgres -d voxe -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'users';"

