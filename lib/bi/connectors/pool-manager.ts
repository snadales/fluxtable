import { Pool as PgPool } from 'pg';
import mysql, { Pool as MysqlPool } from 'mysql2/promise';

export type BiSourceType = 'local_baserow' | 'odoo_ro' | 'voz_ro' | 'pimcore_ro';

interface PoolConfig {
  odoo?: {
    connectionString?: string;
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
  };
  voz?: {
    connectionString?: string;
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
  };
  pimcore?: {
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
  };
}

class BiPoolManager {
  private static instance: BiPoolManager;
  private odooPool: PgPool | null = null;
  private vozPool: PgPool | null = null;
  private pimcorePool: MysqlPool | null = null;

  private constructor() {}

  public static getInstance(): BiPoolManager {
    if (!BiPoolManager.instance) {
      BiPoolManager.instance = new BiPoolManager();
    }
    return BiPoolManager.instance;
  }

  /**
   * Obtiene o inicializa el pool de PostgreSQL para Odoo 20 (Sólo Lectura, max 3 conexiones)
   */
  public getOdooPool(): PgPool {
    if (!this.odooPool) {
      const connStr = process.env.ODOO_DB_URL;
      this.odooPool = new PgPool(
        connStr
          ? {
              connectionString: connStr,
              max: 3,
              idleTimeoutMillis: 10000,
              connectionTimeoutMillis: 5000,
              statement_timeout: 15000,
            }
          : {
              host: process.env.ODOO_DB_HOST || 'odoo20_db',
              port: parseInt(process.env.ODOO_DB_PORT || '5432', 10),
              user: process.env.ODOO_DB_USER || 'baserow_ro',
              password: process.env.ODOO_DB_PASSWORD || 'bi_ro_yarken_2026',
              database: process.env.ODOO_DB_NAME || 'odoo_prod',
              max: 3,
              idleTimeoutMillis: 10000,
              connectionTimeoutMillis: 5000,
              statement_timeout: 15000,
            }
      );
    }
    return this.odooPool;
  }

  /**
   * Obtiene o inicializa el pool de PostgreSQL para Voz Service (Sólo Lectura, max 2 conexiones)
   */
  public getVozPool(): PgPool {
    if (!this.vozPool) {
      const connStr = process.env.VOZ_DB_URL;
      this.vozPool = new PgPool(
        connStr
          ? {
              connectionString: connStr,
              max: 2,
              idleTimeoutMillis: 10000,
              connectionTimeoutMillis: 5000,
              statement_timeout: 10000,
            }
          : {
              host: process.env.VOZ_DB_HOST || 'voz-db',
              port: parseInt(process.env.VOZ_DB_PORT || '5432', 10),
              user: process.env.VOZ_DB_USER || 'baserow_ro',
              password: process.env.VOZ_DB_PASSWORD || 'bi_ro_yarken_2026',
              database: process.env.VOZ_DB_NAME || 'voz',
              max: 2,
              idleTimeoutMillis: 10000,
              connectionTimeoutMillis: 5000,
              statement_timeout: 10000,
            }
      );
    }
    return this.vozPool;
  }

  /**
   * Obtiene o inicializa el pool de MySQL/MariaDB para Pimcore PIM (Sólo Lectura, max 2 conexiones)
   */
  public getPimcorePool(): MysqlPool {
    if (!this.pimcorePool) {
      this.pimcorePool = mysql.createPool({
        host: process.env.PIMCORE_DB_HOST || 'pimcore-db-1',
        port: parseInt(process.env.PIMCORE_DB_PORT || '3306', 10),
        user: process.env.PIMCORE_DB_USER || 'baserow_ro',
        password: process.env.PIMCORE_DB_PASSWORD || 'bi_ro_yarken_2026',
        database: process.env.PIMCORE_DB_NAME || 'pimcore',
        waitForConnections: true,
        connectionLimit: 2,
        queueLimit: 10,
        connectTimeout: 5000,
      });
    }
    return this.pimcorePool;
  }

  /**
   * Valida sintácticamente que la consulta sea estrictamente de sólo lectura
   */
  private validateReadOnly(sqlQuery: string): void {
    const forbidden = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|GRANT|REVOKE|EXEC|CREATE|REPLACE)\b/i;
    if (forbidden.test(sqlQuery)) {
      throw new Error(`CONSULTA_BLOQUEADA: Solo se permiten consultas SELECT de lectura analítica`);
    }
  }

  /**
   * Ejecuta una consulta analítica segura de sólo lectura sobre la fuente seleccionada
   */
  public async executeQuery<T = any>(
    source: BiSourceType,
    sqlQuery: string,
    params: any[] = []
  ): Promise<{ rows: T[]; durationMs: number; source: BiSourceType }> {
    this.validateReadOnly(sqlQuery);
    const start = Date.now();

    if (source === 'odoo_ro') {
      const client = await this.getOdooPool().connect();
      try {
        await client.query('SET TRANSACTION READ ONLY;');
        const res = await client.query(sqlQuery, params);
        return { rows: res.rows, durationMs: Date.now() - start, source };
      } finally {
        client.release();
      }
    }

    if (source === 'voz_ro') {
      const client = await this.getVozPool().connect();
      try {
        await client.query('SET TRANSACTION READ ONLY;');
        const res = await client.query(sqlQuery, params);
        return { rows: res.rows, durationMs: Date.now() - start, source };
      } finally {
        client.release();
      }
    }

    if (source === 'pimcore_ro') {
      const pool = this.getPimcorePool();
      const [rows] = await pool.query(sqlQuery, params);
      return { rows: rows as T[], durationMs: Date.now() - start, source };
    }

    throw new Error(`Fuente no soportada por pool-manager: ${source}. Use db local para local_baserow.`);
  }

  /**
   * Diagnóstico de salud de todas las conexiones
   */
  public async checkHealth(): Promise<Record<BiSourceType, { status: 'ok' | 'error' | 'disabled'; error?: string }>> {
    const results: any = {
      local_baserow: { status: 'ok' },
    };

    // Odoo
    try {
      if (process.env.ODOO_DB_URL || process.env.ODOO_DB_HOST) {
        const pool = this.getOdooPool();
        const client = await pool.connect();
        await client.query('SELECT 1;');
        client.release();
        results.odoo_ro = { status: 'ok' };
      } else {
        results.odoo_ro = { status: 'disabled' };
      }
    } catch (err: any) {
      results.odoo_ro = { status: 'error', error: err.message };
    }

    // Voz
    try {
      if (process.env.VOZ_DB_URL || process.env.VOZ_DB_HOST) {
        const pool = this.getVozPool();
        const client = await pool.connect();
        await client.query('SELECT 1;');
        client.release();
        results.voz_ro = { status: 'ok' };
      } else {
        results.voz_ro = { status: 'disabled' };
      }
    } catch (err: any) {
      results.voz_ro = { status: 'error', error: err.message };
    }

    // Pimcore
    try {
      if (process.env.PIMCORE_DB_HOST) {
        const pool = this.getPimcorePool();
        await pool.query('SELECT 1;');
        results.pimcore_ro = { status: 'ok' };
      } else {
        results.pimcore_ro = { status: 'disabled' };
      }
    } catch (err: any) {
      results.pimcore_ro = { status: 'error', error: err.message };
    }

    return results;
  }

  /**
   * Cierre seguro de pools para tests o graceful shutdown
   */
  public async closeAll(): Promise<void> {
    if (this.odooPool) {
      await this.odooPool.end().catch(() => {});
      this.odooPool = null;
    }
    if (this.vozPool) {
      await this.vozPool.end().catch(() => {});
      this.vozPool = null;
    }
    if (this.pimcorePool) {
      await this.pimcorePool.end().catch(() => {});
      this.pimcorePool = null;
    }
  }
}

export const biPoolManager = BiPoolManager.getInstance();
