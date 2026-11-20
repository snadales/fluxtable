import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { PGlite } from '@electric-sql/pglite';

const dir = path.resolve(__dirname, '../../../db/migrations');
const read = (f: string) => fs.readFileSync(path.join(dir, f), 'utf8').replaceAll('--> statement-breakpoint', '');

describe('migración 0003_dashboard_shares (#54)', () => {
  it('aplica sobre 0000–0002, es idempotente y valida correo y rol', async () => {
    const pg = new PGlite();
    for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) await pg.exec(read(f));
    await pg.exec(read('0003_dashboard_shares.sql')); // segunda vez: sin error

    const { rows: [ws] } = await pg.query<{ id: string }>(`INSERT INTO workspaces (name, slug) VALUES ('w','w') RETURNING id`);
    const { rows: [d] } = await pg.query<{ id: string }>(
      `INSERT INTO bi_dashboards (code, workspace_id, name) VALUES ('D003', $1, 'x') RETURNING id`, [ws.id]
    );
    await pg.query(`INSERT INTO dashboard_shares (dashboard_id, email, role) VALUES ($1, 'a@b.cl', 'lector')`, [d.id]);
    await expect(pg.query(`INSERT INTO dashboard_shares (dashboard_id, email, role) VALUES ($1, 'a@b.cl', 'lector')`, [d.id])).rejects.toThrow();
    await expect(pg.query(`INSERT INTO dashboard_shares (dashboard_id, email, role) VALUES ($1, 'Mayus@b.cl', 'lector')`, [d.id])).rejects.toThrow();
    await expect(pg.query(`INSERT INTO dashboard_shares (dashboard_id, email, role) VALUES ($1, 'c@b.cl', 'admin')`, [d.id])).rejects.toThrow();

    // Borrar el dashboard borra sus accesos.
    await pg.query(`DELETE FROM bi_dashboards WHERE id = $1`, [d.id]);
    const { rows } = await pg.query<{ n: number }>(`SELECT count(*)::int AS n FROM dashboard_shares`);
    expect(rows[0].n).toBe(0);
  });
});
