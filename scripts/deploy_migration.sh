#!/bin/bash
set -e

# Production Database Migration Script for QuantTrade Platform

# Validate required environment variables
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL is not set. Cannot proceed with migration."
    exit 1
fi

echo "Starting database migration..."

# Execute SQL migration script
psql "$DATABASE_URL" << EOF
\set ON_ERROR_STOP on

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Run the full migration script
\ir ../supabase/migrations/20250910041550_scarlet_surf.sql

-- Verify migration
SELECT COUNT(*) as total_tables FROM information_schema.tables 
WHERE table_schema = 'public';

EOF

if [ $? -eq 0 ]; then
    echo "Database migration completed successfully."
else
    echo "Database migration failed."
    exit 1
fi