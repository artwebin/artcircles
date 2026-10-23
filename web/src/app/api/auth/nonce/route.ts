import { NextResponse } from 'next/server';
import { AUTH_ACTION, AUTH_CONTRACT, issueChallenge } from '@/lib/auth/challenge';
import { isValidAccountName } from '@/lib/auth/account';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const actor = new URL(request.url).searchParams.get('account');
    if (!isValidAccountName(actor)) {
        return NextResponse.json({ error: 'Invalid account name' }, { status: 400 });
    }

    const { nonce, verifyToken } = await issueChallenge(actor);
    return NextResponse.json(
        { nonce, verifyToken, contract: AUTH_CONTRACT, action: AUTH_ACTION },
        { headers: { 'Cache-Control': 'no-store' } }
    );
}
