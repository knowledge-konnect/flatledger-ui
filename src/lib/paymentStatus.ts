export type PaymentStatus = 'Cleared' | 'Partial' | 'Overdue' | 'Unpaid';

export function resolvePaymentStatus(args: {
  apiStatus?: string | null;
  computedStatus?: PaymentStatus | null;
  paymentAmount?: number;
}): PaymentStatus {
  const api = (args.apiStatus || '').trim().toLowerCase();

  if (api === 'paid') return 'Cleared';
  if (api === 'partial') return 'Partial';
  if (api === 'overdue') return 'Overdue';
  if (api === 'unpaid') return 'Unpaid';

  const computed = args.computedStatus;
  if (computed === 'Cleared' || computed === 'Partial' || computed === 'Overdue') {
    return computed;
  }

  // Payment rows without a backend status are usually historic records; if a
  // positive amount was recorded, prefer the paid state instead of showing a
  // misleading "Unpaid" label.
  if ((args.paymentAmount ?? 0) > 0) {
    return 'Cleared';
  }

  return 'Unpaid';
}
