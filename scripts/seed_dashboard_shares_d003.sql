-- Accesos iniciales del dashboard D003 (#54). Idempotente.
-- NO se ejecutó contra producción: lo aplica Seba cuando apruebe el despliegue, después de 0003.
--   docker exec -i fluxtable-db psql -U <usuario> -d <bd> -v ON_ERROR_STOP=1 < scripts/seed_dashboard_shares_d003.sql
--
-- - snadales@gmail.com  -> propietario (además es superadmin)
-- - dhayis27@gmail.com  -> colaborador (se crea como usuario 'shared' si no existe; si estaba 'pending' pasa a 'shared';
--                          un member/superadmin existente conserva su rol)

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM bi_dashboards WHERE code = 'D003') THEN
    RAISE EXCEPTION 'No existe el dashboard D003';
  END IF;
END $$;

INSERT INTO users (email, name, role, is_active)
VALUES ('dhayis27@gmail.com', 'dhayis27', 'shared', true)
ON CONFLICT (email) DO UPDATE
  SET role = CASE WHEN users.role = 'pending' THEN 'shared' ELSE users.role END,
      updated_at = now();

INSERT INTO dashboard_shares (dashboard_id, email, role, created_by)
SELECT d.id, v.email, v.role, (SELECT id FROM users WHERE email = 'snadales@gmail.com')
FROM bi_dashboards d
CROSS JOIN (VALUES ('snadales@gmail.com', 'propietario'), ('dhayis27@gmail.com', 'colaborador')) AS v(email, role)
WHERE d.code = 'D003'
ON CONFLICT (dashboard_id, email) DO UPDATE SET role = EXCLUDED.role;

SELECT d.code, s.email, s.role FROM dashboard_shares s JOIN bi_dashboards d ON d.id = s.dashboard_id
WHERE d.code = 'D003' ORDER BY s.role DESC, s.email;

COMMIT;
