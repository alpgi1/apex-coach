-- ══════════════════════════════════════════════════════════
-- V4: Seed a dev user for local testing (pre-auth phase)
-- Will be removed or replaced when Supabase Auth is integrated
-- ══════════════════════════════════════════════════════════

INSERT INTO users (id, supabase_id, email, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'dev-local', 'dev@apexcoach.local', 'Dev User')
ON CONFLICT (supabase_id) DO NOTHING;
