import { NextResponse } from 'next/server';
import { fetchCardConflictContext } from '@/sanity/lib/getConflicts';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const card1 = searchParams.get('card1') || 'Mirror Shield';
  const card2 = searchParams.get('card2') || 'Piercing Bolt';

  try {
    const data = await fetchCardConflictContext(card1, card2);
    return NextResponse.json({ success: true, count: data.length, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}