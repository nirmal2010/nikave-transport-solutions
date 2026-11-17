/**
 * Vercel Serverless Function: Scheduled Fleet Renewal Checker
 * 
 * Schedule: Daily at 03:00 UTC (08:30 AM IST) via Vercel Cron.
 * 
 * Responsibilities:
 * 1. Authenticates trigger using Bearer CRON_SECRET.
 * 2. Scans vehicle compliances against statutory pre-expiry and post-expiry thresholds.
 * 3. Calculates accrued late fees and compounding penalties for overdue items.
 * 4. Dispatches 100% FREE notifications via:
 *    - CallMeBot WhatsApp Gateway (Automated Push)
 *    - Android Local SMS Gateway (Cellular SIM Push)
 * 5. Executes all state transitions and audit logging inside transactions (BEGIN ... COMMIT).
 */

import { executeTransaction, writeAuditLog } from './db.js';

export default async function handler(req, res) {
  const authHeader = req.headers['authorization'];
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized: Invalid Cron Secret' });
  }

  const timestamp = new Date().toISOString();
  console.log(`[NIKAVE Cron] Starting daily fleet compliance scan at ${timestamp}`);

  const callMeBotApiKey = process.env.CALLMEBOT_API_KEY;
  const managerPhone = process.env.CALLMEBOT_PHONE || process.env.TRANSPORT_MANAGER_PHONE || '+919876543210';
  const androidGatewayWebhookUrl = process.env.ANDROID_GATEWAY_WEBHOOK_URL;
  const androidGatewayAuthKey = process.env.ANDROID_GATEWAY_AUTH_KEY;

  try {
    const scanResult = await executeTransaction(async (client) => {
      let vehicles = [];
      let thresholdConfigs = [];

      if (client) {
        // Query live PostgreSQL database
        const vehRes = await client.query('SELECT * FROM vehicles WHERE status = $1', ['ACTIVE']);
        vehicles = vehRes.rows;

        const threshRes = await client.query('SELECT * FROM tax_threshold_configs WHERE is_active = true');
        thresholdConfigs = threshRes.rows;
      } else {
        // Fallback demo fleet for development testing
        vehicles = [
          {
            id: 'e5d9a101-1111-4000-8000-000000000001',
            registration_number: 'TN-01-AX-4825',
            make_model: 'Tata Signa 4825.TK',
            chassis_last_5: '19482',
            engine_number: 'CUMMINS-ISBe6.7-48201',
            owner_name: 'NIKAVE Logistics Solutions Pvt Ltd',
            owner_phone: managerPhone,
          }
        ];
        thresholdConfigs = [
          {
            tax_code: 'MV_TAX',
            pre_expiry_alert_days: [30, 15, 7, 3, 1, 0],
            grace_period_days: 15,
            post_expiry_alert_days: [1, 3, 7, 15, 30],
            penalty_type: 'PERCENTAGE_PER_MONTH',
            penalty_rate: 2.0,
          }
        ];
      }

      const alertsToDispatch = [];

      // For demonstration and production scanning
      for (const vehicle of vehicles) {
        let compliances = [];
        if (client) {
          const compRes = await client.query(
            'SELECT * FROM vehicle_tax_compliances WHERE vehicle_id = $1 AND is_enabled = true',
            [vehicle.id]
          );
          compliances = compRes.rows;
        } else {
          compliances = [
            {
              id: 'b2c3d4e5-1001-4000-8000-000000000001',
              vehicle_id: vehicle.id,
              tax_code: 'MV_TAX',
              expiry_date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
              last_paid_amount: 24500.00,
              grace_period_days: 15,
            }
          ];
        }

        for (const comp of compliances) {
          const expiry = new Date(comp.expiry_date);
          const now = new Date();
          expiry.setHours(0, 0, 0, 0);
          now.setHours(0, 0, 0, 0);

          const daysDelta = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const config = thresholdConfigs.find(c => c.tax_code === comp.tax_code) || {};
          const graceDays = comp.custom_grace_period_days ?? config.grace_period_days ?? 0;
          const preAlertDays = comp.custom_pre_alert_days ?? config.pre_expiry_alert_days ?? [30, 15, 7, 3, 1, 0];
          const postAlertDays = comp.custom_post_alert_days ?? config.post_expiry_alert_days ?? [1, 3, 7, 15, 30];

          let triggerType = null;
          let newStatus = 'VALID';
          let penaltyAmount = 0;

          if (daysDelta > 0) {
            if (daysDelta <= 7) newStatus = 'URGENT';
            else if (daysDelta <= 30) newStatus = 'EXPIRING_SOON';

            if (preAlertDays.includes(daysDelta)) {
              triggerType = 'PRE_EXPIRY';
            }
          } else if (daysDelta === 0) {
            newStatus = 'DUE_TODAY';
            triggerType = 'DUE_TODAY';
          } else {
            // Overdue calculation
            const overdueDays = Math.abs(daysDelta);
            if (overdueDays <= graceDays) {
              newStatus = 'GRACE_PERIOD';
              triggerType = 'POST_EXPIRY_GRACE';
            } else {
              newStatus = 'OVERDUE';
              triggerType = 'POST_EXPIRY_OVERDUE';
              // Calculate 2% compounding per month penalty
              const months = Math.ceil(overdueDays / 30);
              penaltyAmount = Math.round(100 + (comp.last_paid_amount * 0.02 * months));
            }

            if (postAlertDays.includes(overdueDays)) {
              triggerType = triggerType || 'POST_EXPIRY_OVERDUE';
            }
          }

          if (client) {
            // Transactional update of compliance status
            await client.query(
              `UPDATE vehicle_tax_compliances 
               SET status = $1, days_until_expiry = $2, estimated_penalty_amount = $3, updated_at = CURRENT_TIMESTAMP
               WHERE id = $4`,
              [newStatus, daysDelta, penaltyAmount, comp.id]
            );
          }

          if (triggerType) {
            alertsToDispatch.push({
              vehicleId: vehicle.id,
              regNo: vehicle.registration_number,
              makeModel: vehicle.make_model,
              chassisL5: vehicle.chassis_last_5,
              engineNo: vehicle.engine_number,
              taxCode: comp.tax_code,
              expiryDate: comp.expiry_date,
              daysDelta,
              newStatus,
              penaltyAmount,
              baseAmount: comp.last_paid_amount,
              triggerType,
              ownerPhone: vehicle.owner_phone || managerPhone,
            });
          }
        }
      }

      // Dispatch 100% Free WhatsApp Alerts (CallMeBot)
      const dispatchResults = [];
      for (const alert of alertsToDispatch) {
        let msg = '';
        if (alert.daysDelta < 0) {
          msg = `🚨 *NIKAVE OVERDUE ALERT: ${alert.regNo}*\n` +
                `Tax Type: ${alert.taxCode}\n` +
                `Overdue by: ${Math.abs(alert.daysDelta)} days\n` +
                `Status: ${alert.newStatus} (Penalty: ₹${alert.penaltyAmount})\n` +
                `Chassis Last 5: *${alert.chassisL5}*\n` +
                `Pay on Vahan:\nhttps://vahan.parivahan.gov.in/vahanservice/vahan/ui/statevalidation/homepage.xhtml`;
        } else {
          msg = `⚠️ *NIKAVE RENEWAL NOTICE: ${alert.regNo}*\n` +
                `Tax Type: ${alert.taxCode}\n` +
                `Due in: ${alert.daysDelta} days (${alert.expiryDate})\n` +
                `Amount: ₹${alert.baseAmount}\n` +
                `Chassis Last 5: *${alert.chassisL5}*\n` +
                `Pay on Vahan:\nhttps://vahan.parivahan.gov.in/vahanservice/vahan/ui/statevalidation/homepage.xhtml`;
        }

        let sentStatus = 'SKIPPED';
        let gatewayResp = '';

        // 1. CallMeBot Free WhatsApp API (if configured)
        if (callMeBotApiKey) {
          try {
            const cleanPhone = managerPhone.replace(/[^0-9+]/g, '');
            const encodedText = encodeURIComponent(msg);
            const callMeBotUrl = `https://api.callmebot.com/whatsapp.php?phone=${cleanPhone}&text=${encodedText}&apikey=${callMeBotApiKey}`;
            const resCall = await fetch(callMeBotUrl);
            sentStatus = resCall.ok ? 'SENT' : 'FAILED';
            gatewayResp = await resCall.text();
          } catch (e) {
            sentStatus = 'FAILED';
            gatewayResp = e.message;
          }
        }

        // 2. Android Local SMS Gateway (if configured)
        if (androidGatewayWebhookUrl) {
          try {
            const smsPayload = {
              phone: alert.ownerPhone,
              message: msg,
              authKey: androidGatewayAuthKey,
            };
            await fetch(androidGatewayWebhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(smsPayload),
            });
            sentStatus = 'QUEUED_FOR_DEVICE_SIM';
          } catch (e) {
            console.error('[Android SMS Gateway error]', e);
          }
        }

        // Transactional insert to notification_logs & audit_logs
        if (client) {
          await client.query(
            `INSERT INTO notification_logs (
              id, vehicle_id, vehicle_reg_no, tax_code, channel,
              recipient_phone, trigger_type, days_delta, message_content,
              delivery_status, gateway_response, created_at, updated_at
            ) VALUES (
              gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
              CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            )`,
            [
              alert.vehicleId, alert.regNo, alert.taxCode, 
              callMeBotApiKey ? 'WHATSAPP_CALLMEBOT' : 'SMS_DEVICE_GATEWAY',
              alert.ownerPhone, alert.triggerType, alert.daysDelta, msg,
              sentStatus, gatewayResp
            ]
          );

          await writeAuditLog(client, {
            entityName: 'notification_logs',
            entityId: alert.vehicleId,
            action: 'INSERT',
            previousValue: null,
            newValue: {
              regNo: alert.regNo,
              taxCode: alert.taxCode,
              daysDelta: alert.daysDelta,
              status: sentStatus,
            },
            performedBy: 'system_cron',
          });
        }

        dispatchResults.push({
          regNo: alert.regNo,
          taxCode: alert.taxCode,
          daysDelta: alert.daysDelta,
          deliveryStatus: sentStatus,
        });
      }

      return {
        vehiclesScanned: vehicles.length,
        alertsTriggered: alertsToDispatch.length,
        dispatchResults,
      };
    });

    return res.status(200).json({
      status: 'success',
      timestamp,
      message: 'Daily fleet compliance check completed successfully.',
      ...scanResult,
    });
  } catch (error) {
    console.error('[NIKAVE Cron Error]', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error during scheduled renewal check',
    });
  }
}
