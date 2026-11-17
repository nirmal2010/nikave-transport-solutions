import { ComplianceRecord, ComplianceStatus, TaxType, Vehicle } from '../types/vehicle';

export const VAHAN_PORTAL_URL = 'https://vahan.parivahan.gov.in/vahanservice/vahan/ui/statevalidation/homepage.xhtml';

export const TAX_NAMES: Record<TaxType, string> = {
  mv_tax: 'Motor Vehicle Tax',
  green_tax: 'Green Tax (Environmental Cess)',
  insurance: 'Commercial Vehicle Insurance',
  fitness: 'Fitness Certificate (FC)',
  permit: 'Goods / Commercial Permit',
  pucc: 'Pollution Under Control (PUCC)',
};

export const TAX_SHORT_NAMES: Record<TaxType, string> = {
  mv_tax: 'MV Tax',
  green_tax: 'Green Tax',
  insurance: 'Insurance',
  fitness: 'Fitness (FC)',
  permit: 'Permit',
  pucc: 'PUCC',
};

// Statutory default grace periods in India (in days)
export const STATUTORY_GRACE_PERIODS: Record<TaxType, number> = {
  mv_tax: 15,    // Typically 15 days grace period in most Indian states
  green_tax: 0,   // Zero grace period; blocks FC renewal
  insurance: 0,   // ZERO grace period; vehicle cannot operate legally under MV Act §196
  fitness: 0,     // ZERO grace period; ₹50/day CMVR late fine applies immediately
  permit: 15,     // 15 days grace period for authorization renewal
  pucc: 0,        // ZERO grace period; immediate ₹10,000 spot challan risk
};

/**
 * Calculates days remaining from today until target date.
 * If target date is past, returns negative number.
 */
export function getDaysRemaining(dateString?: string): number {
  if (!dateString) return 9999;
  const target = new Date(dateString);
  const now = new Date();
  
  // Set to start of day for clean calculation
  target.setHours(0, 0, 0, 0);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Derives compliance status based on days remaining and statutory grace periods.
 */
export function getComplianceStatus(record?: ComplianceRecord, taxType?: TaxType): ComplianceStatus {
  if (!record || !record.enabled) return 'not_applicable';
  if (!record.expiryDate) return 'urgent';

  const daysLeft = getDaysRemaining(record.expiryDate);
  const gracePeriod = record.gracePeriodDays ?? (taxType ? STATUTORY_GRACE_PERIODS[taxType] : 0);

  if (daysLeft < 0) {
    const overdueDays = Math.abs(daysLeft);
    if (overdueDays <= gracePeriod) {
      return 'grace_period'; // In legal grace period, but needs urgent renewal
    }
    return 'overdue'; // Past grace period, active compounding penalty
  }

  if (daysLeft === 0) return 'urgent';
  if (daysLeft <= 7) return 'urgent';
  if (daysLeft <= 30) return 'expiring_soon';
  return 'valid';
}

/**
 * Computes estimated penalty in INR for an overdue compliance
 */
export function calculateEstimatedPenalty(taxType: TaxType, daysOverdue: number, baseAmount: number): number {
  if (daysOverdue <= 0) return 0;

  switch (taxType) {
    case 'mv_tax': {
      // 2% per month interest + ₹100 base late fee
      const months = Math.ceil(daysOverdue / 30);
      const interest = baseAmount * (0.02 * months);
      return Math.round(100 + interest);
    }
    case 'fitness': {
      // CMVR Rule: ₹50 flat per day of delay without cap
      return daysOverdue * 50;
    }
    case 'green_tax': {
      // 1.5% per month interest
      const months = Math.ceil(daysOverdue / 30);
      return Math.round(baseAmount * (0.015 * months));
    }
    case 'permit': {
      // 2% per month interest
      const months = Math.ceil(daysOverdue / 30);
      return Math.round(baseAmount * (0.02 * months));
    }
    case 'insurance':
    case 'pucc':
    default:
      return 0; // Police spot fine risk rather than RTO compounding fee
  }
}

/**
 * Color classes and labels for each status badge
 */
export function getStatusBadgeInfo(status: ComplianceStatus) {
  switch (status) {
    case 'overdue':
      return {
        label: 'Overdue (Penalty)',
        bg: 'bg-rose-500/15',
        text: 'text-rose-400',
        border: 'border-rose-500/40',
        badge: 'bg-rose-500',
      };
    case 'grace_period':
      return {
        label: 'Grace Period',
        bg: 'bg-orange-500/15',
        text: 'text-orange-400',
        border: 'border-orange-500/40',
        badge: 'bg-orange-500',
      };
    case 'urgent':
      return {
        label: 'Urgent (≤7d)',
        bg: 'bg-amber-500/15',
        text: 'text-amber-400',
        border: 'border-amber-500/30',
        badge: 'bg-amber-500',
      };
    case 'expiring_soon':
      return {
        label: 'Due Soon (≤30d)',
        bg: 'bg-yellow-500/15',
        text: 'text-yellow-300',
        border: 'border-yellow-500/30',
        badge: 'bg-yellow-400',
      };
    case 'valid':
      return {
        label: 'Compliant',
        bg: 'bg-emerald-500/15',
        text: 'text-emerald-400',
        border: 'border-emerald-500/30',
        badge: 'bg-emerald-500',
      };
    case 'not_applicable':
    default:
      return {
        label: 'N/A',
        bg: 'bg-slate-700/30',
        text: 'text-slate-400',
        border: 'border-slate-700',
        badge: 'bg-slate-500',
      };
  }
}

/**
 * Format currency into Indian Rupees (INR)
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date to human friendly DD MMM YYYY
 */
export function formatDate(dateString?: string): string {
  if (!dateString) return 'Not Set';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Generates formatted WhatsApp Alert Text for Transport Manager
 */
export function generateRenewalMessage(vehicle: Vehicle, taxType: TaxType): string {
  const tax = vehicle.taxes[taxType];
  const daysLeft = getDaysRemaining(tax.expiryDate);
  const daysOverdue = daysLeft < 0 ? Math.abs(daysLeft) : 0;
  const penalty = calculateEstimatedPenalty(taxType, daysOverdue, tax.lastPaidAmount);

  let urgency = '📅 UPCOMING RENEWAL';
  if (daysLeft < 0) {
    urgency = penalty > 0 ? `🚨 OVERDUE — ESTIMATED PENALTY: ${formatINR(penalty)}` : `🚨 OVERDUE / RENEW IMMEDIATELY`;
  } else if (daysLeft <= 7) {
    urgency = '⚠️ URGENT RENEWAL (DUE IN ≤ 7 DAYS)';
  }
  
  return `*NIKAVE Transport Solutions - Compliance Alert*
${urgency}

*Vehicle:* ${vehicle.registrationNumber} (${vehicle.makeModel})
*Tax / Certificate:* ${TAX_NAMES[taxType]}
*Due / Expiry Date:* ${formatDate(tax.expiryDate)} (${daysLeft < 0 ? `${daysOverdue} days overdue` : `${daysLeft} days left`})
*Base Amount:* ${formatINR(tax.lastPaidAmount)}${penalty > 0 ? `\n*Est. Late Penalty:* ${formatINR(penalty)}` : ''}

*Vahan Authentication Keys:*
• Reg No: ${vehicle.registrationNumber}
• Chassis No (Last 5 Digits): *${vehicle.chassisLast5}*
• Engine No: ${vehicle.engineNumber}
• Owner: ${vehicle.ownerName} (${vehicle.ownerPhone})

*Pay Online on Parivahan Vahan Portal:*
${VAHAN_PORTAL_URL}

_Please clear this statutory renewal immediately to prevent vehicle impoundment at check-posts._`;
}

/**
 * Generates Daily Fleet Digest for Transport Manager
 */
export function generateDailyDigest(vehicles: Vehicle[]): string {
  const expiringOrExpired: Array<{
    vehicle: Vehicle;
    taxType: TaxType;
    daysLeft: number;
    expiryDate: string;
    amount: number;
    penalty: number;
  }> = [];

  const types: TaxType[] = ['mv_tax', 'green_tax', 'insurance', 'fitness', 'permit', 'pucc'];

  vehicles.forEach(v => {
    types.forEach(t => {
      const tax = v.taxes[t];
      if (tax && tax.enabled && tax.expiryDate) {
        const days = getDaysRemaining(tax.expiryDate);
        if (days <= 30) {
          const penalty = calculateEstimatedPenalty(t, days < 0 ? Math.abs(days) : 0, tax.lastPaidAmount);
          expiringOrExpired.push({
            vehicle: v,
            taxType: t,
            daysLeft: days,
            expiryDate: tax.expiryDate,
            amount: tax.lastPaidAmount,
            penalty,
          });
        }
      }
    });
  });

  expiringOrExpired.sort((a, b) => a.daysLeft - b.daysLeft);

  if (expiringOrExpired.length === 0) {
    return `*NIKAVE Transport Solutions - Fleet Status* ✅
All commercial vehicles in your fleet are 100% compliant. No pending tax or insurance renewals within the next 30 days.`;
  }

  let text = `*NIKAVE Transport Solutions - Morning Fleet Digest*\n`;
  text += `Generated for Transport Operations | Total Action Items: ${expiringOrExpired.length}\n\n`;

  expiringOrExpired.forEach((item, index) => {
    const statusIcon = item.daysLeft < 0 ? '🚨' : item.daysLeft <= 7 ? '⚠️' : '⏰';
    const dueTxt = item.daysLeft < 0 ? `${Math.abs(item.daysLeft)}d overdue` : `in ${item.daysLeft}d`;
    const penaltyTxt = item.penalty > 0 ? ` | Penalty: +${formatINR(item.penalty)}` : '';
    text += `${index + 1}. ${statusIcon} *${item.vehicle.registrationNumber}* (${item.vehicle.makeModel})\n`;
    text += `   • ${TAX_SHORT_NAMES[item.taxType]}: Due ${formatDate(item.expiryDate)} (${dueTxt})\n`;
    text += `   • Amount: ${formatINR(item.amount)}${penaltyTxt} | Chassis L5: *${item.vehicle.chassisLast5}*\n\n`;
  });

  text += `*Pay MV Tax / Green Tax on Parivahan Vahan:*\n${VAHAN_PORTAL_URL}`;
  return text;
}

/**
 * 100% Free CallMeBot WhatsApp URL Generator
 */
export function getCallMeBotUrl(phone: string, text: string, apiKey: string): string {
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  const encodedText = encodeURIComponent(text);
  return `https://api.callmebot.com/whatsapp.php?phone=${cleanPhone}&text=${encodedText}&apikey=${apiKey}`;
}

/**
 * 100% Free WhatsApp Direct (wa.me) URL Generator
 */
export function getWhatsAppDirectUrl(phone: string, text: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}
