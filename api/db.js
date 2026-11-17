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
    
    // Auto-initialize schema if new database without tables
    const checkTable = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'vehicles'
      );
    `);
    if (!checkTable.rows[0].exists) {
      await initializeSchema(client);
    }

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

async function initializeSchema(client) {
  await client.query(`
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      entity_name VARCHAR(100) NOT NULL,
      entity_id UUID NOT NULL,
      action VARCHAR(20) NOT NULL,
      previous_value JSONB,
      new_value JSONB,
      performed_by VARCHAR(100) DEFAULT 'system',
      ip_address VARCHAR(45),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      registration_number VARCHAR(20) NOT NULL,
      registration_date DATE NOT NULL,
      chassis_number VARCHAR(50) NOT NULL,
      chassis_last_5 VARCHAR(5) NOT NULL,
      engine_number VARCHAR(50) NOT NULL,
      vehicle_class VARCHAR(50) NOT NULL,
      make_model VARCHAR(100) NOT NULL,
      manufacturing_year INT NOT NULL,
      manufacturing_month INT DEFAULT 1,
      gross_vehicle_weight_kg INT NOT NULL,
      unladen_weight_kg INT,
      seating_capacity INT DEFAULT 2,
      fuel_type VARCHAR(30) DEFAULT 'DIESEL',
      emission_norms VARCHAR(20) DEFAULT 'BS-VI',
      body_type VARCHAR(50) DEFAULT 'Tipper',
      color VARCHAR(30),
      state VARCHAR(50) NOT NULL,
      rto_code VARCHAR(50) NOT NULL,
      owner_name VARCHAR(150) NOT NULL,
      owner_father_or_rep_name VARCHAR(150),
      owner_phone VARCHAR(20) NOT NULL,
      owner_email VARCHAR(100),
      owner_address TEXT,
      owner_pan_or_gst VARCHAR(30),
      driver_name VARCHAR(100),
      driver_phone VARCHAR(20),
      driver_license_number VARCHAR(50),
      depot_or_division VARCHAR(100) DEFAULT 'Main Fleet',
      is_hypothecated BOOLEAN DEFAULT FALSE,
      financier_name VARCHAR(150),
      status VARCHAR(30) DEFAULT 'ACTIVE',
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tax_threshold_configs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tax_code VARCHAR(50) NOT NULL,
      tax_name VARCHAR(100) NOT NULL,
      description TEXT,
      default_frequency VARCHAR(30) NOT NULL,
      pre_expiry_alert_days INT[] NOT NULL,
      grace_period_days INT DEFAULT 0,
      post_expiry_alert_days INT[] NOT NULL,
      penalty_type VARCHAR(30) DEFAULT 'PERCENTAGE_PER_MONTH',
      penalty_rate NUMERIC(10,2) DEFAULT 2.00,
      late_fee_flat NUMERIC(10,2) DEFAULT 0.00,
      statutory_warning TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS vehicle_tax_compliances (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      vehicle_id UUID NOT NULL,
      tax_code VARCHAR(50) NOT NULL,
      is_enabled BOOLEAN DEFAULT TRUE,
      last_paid_date DATE,
      expiry_date DATE NOT NULL,
      last_paid_amount NUMERIC(12,2) DEFAULT 0.00,
      receipt_number VARCHAR(100),
      payment_mode VARCHAR(50) DEFAULT 'VAHAN_PORTAL',
      payment_frequency VARCHAR(30) DEFAULT 'QUARTERLY',
      custom_grace_period_days INT,
      custom_pre_alert_days INT[],
      custom_post_alert_days INT[],
      insurance_policy_number VARCHAR(100),
      insurance_provider VARCHAR(150),
      insurance_type VARCHAR(50),
      idv_value NUMERIC(12,2),
      status VARCHAR(30) NOT NULL DEFAULT 'VALID',
      days_until_expiry INT,
      estimated_penalty_amount NUMERIC(12,2) DEFAULT 0.00,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tax_payment_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      vehicle_id UUID NOT NULL,
      vehicle_reg_no VARCHAR(20) NOT NULL,
      tax_code VARCHAR(50) NOT NULL,
      paid_date DATE NOT NULL,
      period_from DATE NOT NULL,
      period_to DATE NOT NULL,
      amount NUMERIC(12,2) NOT NULL,
      green_tax_component NUMERIC(12,2) DEFAULT 0.00,
      penalty_or_fine_paid NUMERIC(12,2) DEFAULT 0.00,
      receipt_challan_no VARCHAR(100) NOT NULL,
      payment_mode VARCHAR(50) NOT NULL,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notification_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      vehicle_id UUID,
      vehicle_reg_no VARCHAR(20),
      tax_code VARCHAR(50),
      channel VARCHAR(50) NOT NULL,
      recipient_phone VARCHAR(30) NOT NULL,
      trigger_type VARCHAR(50) NOT NULL,
      days_delta INT,
      message_content TEXT NOT NULL,
      delivery_status VARCHAR(30) NOT NULL,
      gateway_response TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
  `);
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

