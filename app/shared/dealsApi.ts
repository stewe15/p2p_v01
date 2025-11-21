import { Deal } from '@/app/interfaces/interfaces';

export type UpdateDealPayload = {
  dealUID: string;
  buyer?: string | null;
};

export type UpdateDealResponse = {
  message: string;
  success: boolean;
};

export type RandomKeyResponse = {
  key: string;
};

export type DealIdPayload = {
  dealId: string;
};

export type MyDealsResponse = {
  myDeals: Deal[];
};

export type NeededDealResponse = {
  neededDeal: Deal;
};

export class DealsApi {
  static async updateDeal(payload: UpdateDealPayload): Promise<UpdateDealResponse> {
    const response = await fetch('/api/updateDeals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('Ошибка при обновлении сделки:', response.statusText);
      return { success: false, message: 'Ошибка при обновлении сделки' };
    }

    const data: UpdateDealResponse = await response.json();
    return data;
  }

  static async getDeals(): Promise<Deal[]> {
    const response = await fetch('/api/getDeals');
    if (!response.ok) {
      console.error('Не удалось получить сделки');
      return [];
    }
    const data = await response.json();
    return data.deals || [];
  }

  static async getRandomKey(): Promise<string | null> {
    try {
      const response = await fetch('/api/getRandomKey', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        console.error('Ошибка при получении ключа', response.statusText);
        return null;
      }

      const data: RandomKeyResponse = await response.json();
      return data.key;
    } catch (e) {
      console.error('Ошибка при получении ключа:', e);
      return null;
    }
  }

  static async getMyDeals(telegram_id: string): Promise<MyDealsResponse | null> {
    try {
      const response = await fetch('/api/myDeals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ telegram_id }),
      });

      if (!response.ok) {
        console.error('Ошибка при загрузке сделок пользователя');
        return null;
      }

      const data: MyDealsResponse = await response.json();
      return data;
    } catch (e) {
      console.error('Ошибка при получении сделок:', e);
      return null;
    }
  }

  static async getDealById(payload: DealIdPayload): Promise<NeededDealResponse | null> {
    try {
      const response = await fetch('/api/getDealById', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error('Не удалось получить данные сделки');
        return null;
      }

      const data: NeededDealResponse = await response.json();
      return data;
    } catch (e) {
      console.error('Ошибка при получении сделки по ID:', e);
      return null;
    }
  }

  static async generateBuyerQr(payload: DealIdPayload): Promise<Blob | null> {
    try {
      const response = await fetch('/api/generateBuyer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error('Ошибка при генерации QR-кода покупателя');
        return null;
      }

      return await response.blob();
    } catch (e) {
      console.error('Ошибка при генерации QR-кода покупателя:', e);
      return null;
    }
  }

  static async generateSellerQr(payload: DealIdPayload): Promise<Blob | null> {
    try {
      const response = await fetch('/api/generateSeller', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error('Ошибка при генерации QR-кода продавца');
        return null;
      }

      return await response.blob();
    } catch (e) {
      console.error('Ошибка при генерации QR-кода продавца:', e);
      return null;
    }
  }
}
