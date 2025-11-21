import { NextResponse } from 'next/server';
import { $api } from '@/app/shared/api';

export const GET = async () => {
  try {
    const { data } = await $api.get('/userStats');
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('userStats error:', error?.message || error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
};
