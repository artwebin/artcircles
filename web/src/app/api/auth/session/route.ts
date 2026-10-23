import { NextResponse } from 'next/server';
import { getSessionActor } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET() {
    const actor = await getSessionActor();
    return NextResponse.json({ actor }, {
        headers: { 'Cache-Control': 'no-store' },
    });
}
