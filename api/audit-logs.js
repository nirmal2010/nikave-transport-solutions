/**
 * Serverless API: Audit Logs Query Endpoint
 * Reads immutable transaction logs with pre-image (previous_value) and post-image (new_value).
 */

import { getDbPool } from './db.js';

export default async function handler(req, res) {
  const pool = getDbPool();

  if (!pool) {
    // Return sample audit logs if database is not connected
    return res.status(200).json({
      status: 'success',
      data: [
        {
          id: 'f1a2b3c4-0001-4000-8000-000000000001',
          entity_name: 'vehicles',
          entity_id: 'e5d9a101-1111-4000-8000-000000000001',
          action: 'INSERT',
          previous_value: null,
          new_value: {
            registration_number: 'TN-01-AX-4825',
            make_model: 'Tata Signa 4825.TK',
            owner_name: 'NIKAVE Logistics Solutions Pvt Ltd',
          },
          performed_by: 'system_seed',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ],
      note: 'Using in-memory/client fallback logs. Set POSTGRES_URL to read from live Vercel Postgres.',
    });
  }

  try {
    const limit = parseInt(req.query.limit || '50', 10);
    const result = await pool.query(
      `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );

    return res.status(200).json({
      status: 'success',
      data: result.rows,
    });
  } catch (err) {
    console.error('[Audit Logs API Error]', err);
    return res.status(500).json({
      status: 'error',
      message: err.message,
    });
  }
}

