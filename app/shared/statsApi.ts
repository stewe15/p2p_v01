import { DealsStatsResponse, UserStatsResponse } from '@/app/shared/statsDomain';

export class StatsApi {
  static async getDealsStats(): Promise<DealsStatsResponse> {
    const res = await fetch('/api/dealsStats');
    if (!res.ok) {
      console.error('dealsStats error:', res.status, res.statusText);
      return { success: false, message: 'Ошибка загрузки статистики' };
    }
    return (await res.json()) as DealsStatsResponse;
  }

  static async getUserStats(): Promise<UserStatsResponse> {
    const res = await fetch('/api/userStats');
    if (!res.ok) {
      console.error('userStats error:', res.status, res.statusText);
      return { success: false, message: 'Ошибка загрузки статистики по пользователям' };
    }
    return (await res.json()) as UserStatsResponse;
  }
}
