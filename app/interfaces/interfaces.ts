export type DealStatus = 'active' | 'pending' | 'completed';

export interface Deal {
  uid: string;
  time: string;
  status: DealStatus;
  stars_amount: number;
  telegram_id: string;
  price: number,
  buyer:string
}

export interface User {
  telegram_id: string;
  username: string;
  password: string
}

export interface RegisterAndLoginResponse{
  message: string;
  success: boolean;
  telegram_id: string;
  username: string;
}

export const CurrencySign = '₽'
export const TelegramStar = '⭐'