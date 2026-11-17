/**
 * Vercel Serverless Function: Vehicles API
 * Handles listing, creating, and deleting vehicles in PostgreSQL.
 * All mutations are strictly transactional with automatic audit logging.
 */

import { executeTransaction, writeAuditLog } from './db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const result = await executeTransaction(async (client) => {
        if (!client) return [];

        const vehRes = await client.query(`
          SELECT * FROM vehicles 
          WHERE status = 'ACTIVE' 
          ORDER BY created_at DESC
        `);

        const vehicles = [];
        for (const v of vehRes.rows) {
          const compRes = await client.query(
            'SELECT * FROM vehicle_tax_compliances WHERE vehicle_id = $1',
            [v.id]
          );

          const payRes = await client.query(
            'SELECT * FROM tax_payment_logs WHERE vehicle_id = $1 ORDER BY paid_date DESC',
            [v.id]
          );

          // Map PostgreSQL row to frontend Vehicle model
          const taxes = {};
          for (const c of compRes.rows) {
            const code = c.tax_code.toLowerCase();
            taxes[code] = {
              expiryDate: c.expiry_date ? c.expiry_date.toISOString().split('T')[0] : '',
              lastPaidDate: c.last_paid_date ? c.last_paid_date.toISOString().split('T')[0] : '',
              lastPaidAmount: Number(c.last_paid_amount || 0),
              receiptNumber: c.receipt_number || '',
              paymentFrequency: c.payment_frequency || 'quarterly',
              status: c.status || 'VALID',
              daysUntilExpiry: c.days_until_expiry || 0,
              estimatedPenaltyAmount: Number(c.estimated_penalty_amount || 0),
              gracePeriodDays: c.custom_grace_period_days || 0,
              policyNumber: c.insurance_policy_number,
              insuranceProvider: c.insurance_provider,
            };
          }

          vehicles.push({
            id: v.id,
            registrationNumber: v.registration_number,
            registrationDate: v.registration_date ? v.registration_date.toISOString().split('T')[0] : '',
            chassisNumber: v.chassis_number,
            chassisLast5: v.chassis_last_5,
            engineNumber: v.engine_number,
            vehicleType: v.vehicle_class,
            makeModel: v.make_model,
            manufacturingYear: v.manufacturing_year,
            manufacturingMonth: v.manufacturing_month || 1,
            grossVehicleWeightKg: v.gross_vehicle_weight_kg,
            unladenWeightKg: v.unladen_weight_kg || 0,
            state: v.state,
            rtoCode: v.rto_code,
            ownerName: v.owner_name,
            ownerPhone: v.owner_phone,
            ownerEmail: v.owner_email || '',
            driverName: v.driver_name || '',
            driverPhone: v.driver_phone || '',
            status: v.status || 'ACTIVE',
            taxes,
            paymentHistory: payRes.rows.map(p => ({
              id: p.id,
              vehicleId: p.vehicle_id,
              vehicleReg: p.vehicle_reg_no,
              taxType: p.tax_code.toLowerCase(),
              paidDate: p.paid_date ? p.paid_date.toISOString().split('T')[0] : '',
              periodFrom: p.period_from ? p.period_from.toISOString().split('T')[0] : '',
              periodTo: p.period_to ? p.period_to.toISOString().split('T')[0] : '',
              amount: Number(p.amount),
              receiptChallanNo: p.receipt_challan_no,
              paymentMode: p.payment_mode,
              notes: p.notes,
              createdAt: p.created_at ? p.created_at.toISOString() : '',
            })),
            createdAt: v.created_at ? v.created_at.toISOString() : '',
            updatedAt: v.updated_at ? v.updated_at.toISOString() : '',
          });
        }
        return vehicles;
      });

      return res.status(200).json({ status: 'success', data: result });
    }

    if (req.method === 'POST') {
      const data = req.body;
      if (!data || !data.registrationNumber) {
        return res.status(400).json({ status: 'error', message: 'Registration number is required' });
      }

      const newVehicle = await executeTransaction(async (client) => {
        if (!client) return data;

        const regNo = data.registrationNumber.toUpperCase().trim();
        const chassis = (data.chassisNumber || '').toUpperCase().trim();
        const chassisL5 = chassis.slice(-5) || data.chassisLast5 || '00000';
        const engine = (data.engineNumber || '').toUpperCase().trim();

        // Insert vehicle master
        const vInsert = await client.query(`
          INSERT INTO vehicles (
            id, registration_number, registration_date, chassis_number, chassis_last_5,
            engine_number, vehicle_class, make_model, manufacturing_year, manufacturing_month,
            gross_vehicle_weight_kg, unladen_weight_kg, state, rto_code, owner_name,
            owner_phone, owner_email, driver_name, driver_phone, status, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4,
            $5, $6, $7, $8, $9,
            $10, $11, $12, $13, $14,
            $15, $16, $17, $18, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          ) RETURNING *
        `, [
          regNo,
          data.registrationDate || new Date().toISOString().split('T')[0],
          chassis,
          chassisL5,
          engine,
          data.vehicleType || 'Commercial Vehicle',
          data.makeModel || 'Commercial Truck',
          data.manufacturingYear || new Date().getFullYear(),
          data.manufacturingMonth || 1,
          data.grossVehicleWeightKg || 16200,
          data.unladenWeightKg || 5000,
          data.state || 'Tamil Nadu',
          data.rtoCode || 'TN-01',
          data.ownerName || 'Transport Manager',
          data.ownerPhone || '+919876543210',
          data.ownerEmail || null,
          data.driverName || null,
          data.driverPhone || null,
        ]);

        const insertedV = vInsert.rows[0];

        // Insert default compliances
        const taxCodes = ['MV_TAX', 'GREEN_TAX', 'INSURANCE', 'FITNESS', 'PERMIT', 'PUCC'];
        for (const code of taxCodes) {
          const compData = data.taxes ? (data.taxes[code.toLowerCase()] || {}) : {};
          const expiry = compData.expiryDate || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0];
          await client.query(`
            INSERT INTO vehicle_tax_compliances (
              id, vehicle_id, tax_code, is_enabled, expiry_date, last_paid_amount,
              receipt_number, payment_frequency, status, created_at, updated_at
            ) VALUES (
              gen_random_uuid(), $1, $2, true, $3, $4,
              $5, $6, 'VALID', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            )
          `, [
            insertedV.id,
            code,
            expiry,
            compData.lastPaidAmount || 0,
            compData.receiptNumber || null,
            compData.paymentFrequency || 'quarterly'
          ]);
        }

        // Audit log
        await writeAuditLog(client, {
          entityName: 'vehicles',
          entityId: insertedV.id,
          action: 'INSERT',
          previousValue: null,
          newValue: {
            registrationNumber: insertedV.registration_number,
            makeModel: insertedV.make_model,
            ownerName: insertedV.owner_name,
          },
          performedBy: 'web_user',
        });

        return { id: insertedV.id, registrationNumber: insertedV.registration_number };
      });

      return res.status(201).json({ status: 'success', data: newVehicle });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ status: 'error', message: 'Vehicle ID is required' });
      }

      await executeTransaction(async (client) => {
        if (!client) return;

        const vRes = await client.query('SELECT * FROM vehicles WHERE id = $1', [id]);
        if (vRes.rows.length === 0) return;

        const prev = vRes.rows[0];

        await client.query('DELETE FROM vehicle_tax_compliances WHERE vehicle_id = $1', [id]);
        await client.query('DELETE FROM tax_payment_logs WHERE vehicle_id = $1', [id]);
        await client.query('DELETE FROM notification_logs WHERE vehicle_id = $1', [id]);
        await client.query('DELETE FROM vehicles WHERE id = $1', [id]);

        await writeAuditLog(client, {
          entityName: 'vehicles',
          entityId: id,
          action: 'DELETE',
          previousValue: { registrationNumber: prev.registration_number },
          newValue: null,
          performedBy: 'web_user',
        });
      });

      return res.status(200).json({ status: 'success', message: 'Vehicle deleted successfully' });
    }

    return res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
  } catch (error) {
    console.error('[API vehicles Error]', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
}
