import { NextRequest, NextResponse } from 'next/server';
import { $api } from '@/app/shared/api';

export const POST = async (request: NextRequest) => {
  const body = await request.json();

  try {
    const { data } = await $api.post('/getBalance', body);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('GetBalance error:', error.message);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
};
