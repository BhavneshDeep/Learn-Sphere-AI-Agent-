-- Enable pgvector extension (run this manually in your PostgreSQL database)
-- This is optional - the system will work with JSON embeddings, but pgvector provides better performance
-- 
-- To run this:
-- psql -U your_user -d your_database -f prisma/migrations/enable_pgvector.sql
-- 
-- Or connect to your database and run:
-- CREATE EXTENSION IF NOT EXISTS vector;

CREATE EXTENSION IF NOT EXISTS vector;




