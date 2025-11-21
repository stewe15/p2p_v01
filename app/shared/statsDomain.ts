export type DealStat = {
  date: string;
  dealsCount: number;
  totalRub: number;
  totalStars: number;
};

export type DealsStatsOverall = {
  totalDeals: number;
  totalRub: number;
  totalStars: number;
};

export type DealsStatsResponse = {
  success?: boolean;
  stats?: DealStat[];
  overall?: DealsStatsOverall | null;
  message?: string;
};

export type UserStat = {
  telegram_id: string;
  sellDeals: number;
  buyDeals: number;
  sellStars: number;
  buyStars: number;
  sellRub: number;
  buyRub: number;
  totalDeals: number;
  totalStars: number;
  totalRub: number;
};

export type UserStatsResponse = {
  success?: boolean;
  users?: UserStat[];
  message?: string;
};
