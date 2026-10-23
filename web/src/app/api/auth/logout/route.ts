import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { destroySession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function POST() {
    await destroySession();
    (await cookies()).delete('xpr_auth');
    return NextResponse.json({ ok: true });
}
