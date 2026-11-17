/**
 * Database client and Transaction Manager for NIKAVE Transport Solutions.
 * Supports Vercel Postgres / Neon Serverless Postgres.
 * Enforces:
 *  - ZERO Foreign Key constraints
 *  - Standard UUID generation
 *  - Default created_at and updated_at
 *  - Atomic transactions with automatic audit logging
 */

import { Pool } from 'pg';

let pool;

export function getDbPool() {
  if (!pool) {
    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (connectionString) {
      pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
      });
    }
  }
  return pool;
}

/**
 * Executes a callback inside a strict PostgreSQL transaction (BEGIN ... COMMIT / ROLLBACK)
 */
export async function executeTransaction(callback) {
  const p = getDbPool();
  if (!p) {
    // If running in development without PostgreSQL credentials, simulate transaction safely
    return await callback(null);
  }

  const client = await p.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Writes an audit record inside the active transaction
 */
export async function writeAuditLog(client, {
  entityName,
  entityId,
  action,
  previousValue,
  newValue,
  performedBy = 'system_cron',
  ipAddress = null,
}) {
  if (!client) return; // In simulated mode

  const query = `
    INSERT INTO audit_logs (
      id, entity_name, entity_id, action, 
      previous_value, new_value, performed_by, ip_address, 
      created_at, updated_at
    ) VALUES (
      gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, 
      CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
  `;

  await client.query(query, [
    entityName,
    entityId,
    action,
    previousValue ? JSON.stringify(previousValue) : null,
    newValue ? JSON.stringify(newValue) : null,
    performedBy,
    ipAddress,
  ]);
}

