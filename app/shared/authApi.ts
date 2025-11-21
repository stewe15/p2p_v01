import { RegisterAndLoginResponse } from '@/app/interfaces/interfaces';

export class AuthApi {
  static async login(values: any): Promise<RegisterAndLoginResponse | null> {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        console.error('Login error:', response.status, response.statusText);
        return null;
      }

      return (await response.json()) as RegisterAndLoginResponse;
    } catch (e) {
      console.error('Login exception:', e);
      return null;
    }
  }

  static async register(values: any): Promise<RegisterAndLoginResponse | null> {
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        console.error('Register error:', response.status, response.statusText);
        return null;
      }

      return (await response.json()) as RegisterAndLoginResponse;
    } catch (e) {
      console.error('Register exception:', e);
      return null;
    }
  }
}
