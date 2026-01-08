-- Migration 001: Add Performance Indexes for PostgreSQL/CockroachDB
-- Created: 2026-01-08
-- Purpose: Optimize query performance for team posts, users, and join requests

-- ============================================================================
-- 1. TEAM POSTS INDEXES
-- ============================================================================

-- Index for team posts by status and creation date (for listing active posts)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_team_posts_status_created 
ON documents ((doc->>'status'), (doc->>'createdAt')) 
WHERE collection = 'team_posts';

-- Index for team posts by creator (for user's own posts)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_team_posts_creator 
ON documents ((doc->'createdBy'->>'id')) 
WHERE collection = 'team_posts';

-- GIN index for roles needed (for role-based search)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_team_posts_roles 
ON documents USING GIN ((doc->'rolesNeeded')) 
WHERE collection = 'team_posts';

-- Index for team posts expiration (for active posts filtering)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_team_posts_expires 
ON documents ((doc->>'expiresAt'), (doc->>'status')) 
WHERE collection = 'team_posts';

-- ============================================================================
-- 2. USERS INDEXES
-- ============================================================================

-- GIN index for user matching profile (for teammate recommendations)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_matching_profile 
ON documents USING GIN ((doc->'matchingProfile')) 
WHERE collection = 'users';

-- Index for users open to new teams
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_open_to_teams 
ON documents ((doc->'matchingProfile'->>'openToNewTeams')) 
WHERE collection = 'users' 
  AND (doc->'matchingProfile'->>'openToNewTeams')::boolean = true;

-- Index for user consents
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_consents 
ON documents ((doc->'consents'->>'allowMatching')) 
WHERE collection = 'users';

-- ============================================================================
-- 3. JOIN REQUESTS INDEXES
-- ============================================================================

-- Index for join requests by post and status (for pending requests count)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_join_requests_post_status 
ON documents ((doc->>'teamPostId'), (doc->>'status')) 
WHERE collection = 'team_join_requests';

-- Index for join requests by user
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_join_requests_user 
ON documents ((doc->>'userId')) 
WHERE collection = 'team_join_requests';

-- ============================================================================
-- 4. CONTESTS INDEXES
-- ============================================================================

-- Index for contests by status and deadline
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contests_status_deadline 
ON documents ((doc->>'status'), (doc->>'deadline')) 
WHERE collection = 'contests';

-- GIN index for contest tags (for tag-based search)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contests_tags 
ON documents USING GIN ((doc->'tags')) 
WHERE collection = 'contests';

-- ============================================================================
-- 5. AUDIT LOGS INDEXES
-- ============================================================================

-- Index for audit logs by user and date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_date 
ON documents ((doc->>'userId'), (doc->>'createdAt')) 
WHERE collection = 'audit_logs';

-- Index for audit logs by action type
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_action 
ON documents ((doc->>'action'), (doc->>'createdAt')) 
WHERE collection = 'audit_logs';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these after migration to verify indexes were created:
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'documents' ORDER BY indexname;

-- Check index usage (after some queries have run):
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch 
-- FROM pg_stat_user_indexes 
-- WHERE tablename = 'documents' 
-- ORDER BY idx_scan DESC;
