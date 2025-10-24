import { NextRequest, NextResponse } from 'next/server';
import { $api } from '@/app/shared/api';

export const POST = async (request: NextRequest) => {
  const body = await request.json();

  try {
    const { data } = await $api.post('/handleDeal', body);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('HandleDeal error:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
};
