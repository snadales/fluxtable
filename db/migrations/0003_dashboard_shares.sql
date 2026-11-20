-- Migración 0003: compartir dashboards por usuario con roles (#54)
-- Idempotente (igual que 0001/0002): se aplica a mano con psql; drizzle-kit migrate solo registra 0000.
--   docker exec -i fluxtable-db psql -U <usuario> -d <bd> < db/migrations/0003_dashboard_shares.sql
--
-- users.role es TEXT sin CHECK: el valor nuevo 'shared' («lector de compartidos») no requiere DDL.

CREATE TABLE IF NOT EXISTS dashboard_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dashboard_id UUID NOT NULL REFERENCES bi_dashboards(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT dashboard_shares_email_lower CHECK (email = lower(btrim(email))),
    CONSTRAINT dashboard_shares_role_valid CHECK (role IN ('lector', 'colaborador', 'propietario'))
);

CREATE UNIQUE INDEX IF NOT EXISTS dashboard_shares_dashboard_email_idx ON dashboard_shares (dashboard_id, email);
CREATE INDEX IF NOT EXISTS dashboard_shares_email_idx ON dashboard_shares (email);
