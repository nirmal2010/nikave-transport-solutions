/**
 * Vercel Serverless Function: Tax Payments API
 * Transactionally records payments in tax_payment_logs, updates vehicle_tax_compliances,
 * and writes an audit log in audit_logs.
 */

import { executeTransaction, writeAuditLog } from './db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const result = await executeTransaction(async (client) => {
        if (!client) return [];
        const logs = await client.query('SELECT * FROM tax_payment_logs ORDER BY paid_date DESC LIMIT 100');
        return logs.rows;
      });
      return res.status(200).json({ status: 'success', data: result });
    }

    if (req.method === 'POST') {
      const p = req.body;
      if (!p || !p.vehicleId || !p.amount || !p.taxType) {
        return res.status(400).json({ status: 'error', message: 'Missing required payment fields' });
      }

      const recorded = await executeTransaction(async (client) => {
        if (!client) return p;

        const taxCode = p.taxType.toUpperCase();
        const vRes = await client.query('SELECT registration_number FROM vehicles WHERE id = $1', [p.vehicleId]);
        const regNo = vRes.rows[0]?.registration_number || p.vehicleReg || 'UNKNOWN';

        // 1. Insert tax_payment_logs
        const payRes = await client.query(`
          INSERT INTO tax_payment_logs (
            id, vehicle_id, vehicle_reg_no, tax_code, paid_date, period_from, period_to,
            amount, green_tax_component, penalty_or_fine_paid, receipt_challan_no,
            payment_mode, notes, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          ) RETURNING *
        `, [
          p.vehicleId,
          regNo,
          taxCode,
          p.paidDate || new Date().toISOString().split('T')[0],
          p.periodFrom || new Date().toISOString().split('T')[0],
          p.periodTo || new Date().toISOString().split('T')[0],
          p.amount,
          p.greenTaxComponent || 0,
          p.penaltyOrFinePaid || 0,
          p.receiptChallanNo || 'REC-' + Date.now().toString().slice(-6),
          p.paymentMode || 'Vahan Portal (Online)',
          p.notes || null,
        ]);

        // 2. Update compliance expiry date and status
        await client.query(`
          UPDATE vehicle_tax_compliances
          SET expiry_date = $1, last_paid_date = $2, last_paid_amount = $3,
              receipt_number = $4, status = 'VALID', days_until_expiry = 90,
              estimated_penalty_amount = 0, updated_at = CURRENT_TIMESTAMP
          WHERE vehicle_id = $5 AND tax_code = $6
        `, [
          p.periodTo,
          p.paidDate,
          p.amount,
          p.receiptChallanNo,
          p.vehicleId,
          taxCode
        ]);

        // 3. Write Audit Log
        await writeAuditLog(client, {
          entityName: 'tax_payment_logs',
          entityId: payRes.rows[0].id,
          action: 'INSERT',
          previousValue: null,
          newValue: {
            vehicleReg: regNo,
            taxCode,
            amount: p.amount,
            receiptChallanNo: p.receiptChallanNo,
            newExpiry: p.periodTo,
          },
          performedBy: 'web_user',
        });

        return payRes.rows[0];
      });

      return res.status(201).json({ status: 'success', data: recorded });
    }

    return res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
  } catch (error) {
    console.error('[API payments Error]', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
}
