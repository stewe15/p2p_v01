export type BalanceDto = {
  rub: number;
  stars: number;
};

export type BalanceResponse = {
  success?: boolean;
  balance?: BalanceDto;
  message?: string;
};

export class BalanceApi {
  static async getBalance(telegram_id: string): Promise<BalanceResponse | null> {
    try {
      const res = await fetch('/api/getBalance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegram_id }),
      });

      if (!res.ok) {
        console.error('getBalance error:', res.status, res.statusText);
        return null;
      }

      return (await res.json()) as BalanceResponse;
    } catch (e) {
      console.error('getBalance exception:', e);
      return null;
    }
  }
}
