import { NextRequest, NextResponse } from 'next/server';
import { $api } from '@/app/shared/api';

export const POST = async (request: NextRequest) => {
  const body = await request.json();
  try {
    const { data } = await $api.post('/generateBuyer', body, {
      responseType: 'arraybuffer'
    });

    return new NextResponse(data, {
      headers: { 'Content-Type': 'image/png' }
    });
  } catch (error: any) {
    console.error('GenerateBuyer error:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
};
