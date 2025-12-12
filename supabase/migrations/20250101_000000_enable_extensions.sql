-- ============================================
-- KETAB-YAR: ENABLE REQUIRED EXTENSIONS
-- ============================================
-- Enable PostgreSQL extensions needed for the platform
-- Date: 2025-01-01
-- ============================================

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Performance monitoring
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Full-text search (for future use)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
