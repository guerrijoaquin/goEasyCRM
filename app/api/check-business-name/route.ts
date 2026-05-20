import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get('name');

  if (!name) {
    return NextResponse.json({ error: 'Missing business name' }, { status: 400 });
  }

  try {
    const existingBusiness = await queryOne(
      'SELECT id FROM businesses WHERE name = $1 LIMIT 1',
      [name],
    );

    if (existingBusiness) {
      return NextResponse.json({ error: 'El nombre del negocio ya está en uso.' }, { status: 409 });
    }

    return NextResponse.json({ available: true });
  } catch (error) {
    console.error('Error checking business name:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}