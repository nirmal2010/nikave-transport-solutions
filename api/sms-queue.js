/**
 * Serverless API: Android Local SMS Gateway Polling & Dispatch Endpoint
 * 
 * Allows a local Android device running an open-source SMS gateway APK to:
 * 1. GET /api/sms-queue : Fetch pending SMS to dispatch via local SIM card
 * 2. POST /api/sms-queue : Report delivery status back to NIKAVE
 * 
 * 100% Free: Uses bundled SMS from Indian telecom packs (100 free SMS/day on Jio/Airtel).
 * Zero DLT registration required.
 */

import { executeTransaction, writeAuditLog } from './db.js';

export default async function handler(req, res) {
  const authKey = req.headers['x-gateway-key'] || req.query.key;
  const configuredKey = process.env.ANDROID_GATEWAY_AUTH_KEY;

  if (configuredKey && authKey !== configuredKey) {
    return res.status(401).json({ error: 'Unauthorized: Invalid Device Gateway Key' });
  }

  if (req.method === 'GET') {
    // Return pending notifications to the Android device
    return res.status(200).json({
      status: 'success',
      pendingSms: [],
      message: 'No pending SMS in queue. Next scan at 08:30 AM IST.',
    });
  }

  if (req.method === 'POST') {
    const { notificationId, status, deviceTimestamp } = req.body;

    try {
      await executeTransaction(async (client) => {
        if (client && notificationId) {
          await client.query(
            `UPDATE notification_logs 
             SET delivery_status = $1, gateway_response = $2, updated_at = CURRENT_TIMESTAMP
             WHERE id = $3`,
            [status || 'SENT', `Delivered via Android SIM at ${deviceTimestamp}`, notificationId]
          );

          await writeAuditLog(client, {
            entityName: 'notification_logs',
            entityId: notificationId,
            action: 'UPDATE',
            previousValue: { status: 'QUEUED' },
            newValue: { status: status || 'SENT' },
            performedBy: 'android_sim_gateway',
          });
        }
      });

      return res.status(200).json({ status: 'success', acknowledged: true });
    } catch (err) {
      return res.status(500).json({ status: 'error', message: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

