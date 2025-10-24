import { NextRequest, NextResponse } from 'next/server';
import { $api } from '@/app/shared/api';

export const POST = async (request: NextRequest) => {
  const body = await request.json();
  const cookie = request.headers.get('cookie');

  try {
    const { data } = await $api.post('/register', body, {
      headers: {
        Cookie: cookie || '',
        'Content-Type': 'application/json'
      }
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Register error:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
};
