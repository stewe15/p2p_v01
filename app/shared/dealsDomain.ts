import { Deal, DealStatus, CurrencySign, TelegramStar } from '@/app/interfaces/interfaces';

export type { Deal, DealStatus };
export { CurrencySign, TelegramStar };

export const DEAL_STATUS_COLORS: Record<DealStatus, 'success' | 'warning' | 'processing'> = {
  active: 'success',
  pending: 'warning',
  completed: 'processing',
};

export const DEAL_STATUS_TEXT: Record<DealStatus, string> = {
  active: 'Активна',
  pending: 'Ожидает оплаты',
  completed: 'Завершена',
};

export function normalizeDealStatus(rawStatus: string): DealStatus {
  const s = (rawStatus || '').toString().trim().toLowerCase();

  if (['active', 'in_progress', 'open'].includes(s)) return 'active';
  if (['pending', 'awaiting', 'awaiting_payment'].includes(s)) return 'pending';

  return 'completed';
}
