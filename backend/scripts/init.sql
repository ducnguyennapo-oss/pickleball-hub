-- Create test database for CI
SELECT 'CREATE DATABASE pickleball_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'pickleball_test')\gexec
