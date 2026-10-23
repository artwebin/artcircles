import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ChallengeError, clearChallenge, verifySignedChallenge } from '@/lib/auth/challenge';
import { createSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

const MAX_SERIALIZED_HEX = 4096;
const MAX_TRANSACTION_JSON = 8192;
const MAX_SIGNATURE_LENGTH = 4096;

export async function POST(req: Request) {
    const body = await req.json().catch(() => null);
    const serializedTransaction: unknown = body?.serializedTransaction;
    const transaction: unknown = body?.transaction;
    const signatures: unknown = body?.signatures;

    // Wallets return either the serialized transaction (hex) or the transaction as JSON
    const hasSerialized =
        typeof serializedTransaction === 'string' &&
        serializedTransaction.length > 0 &&
        serializedTransaction.length <= MAX_SERIALIZED_HEX &&
        /^[0-9a-f]+$/i.test(serializedTransaction);
    const hasJson =
        !hasSerialized &&
        typeof transaction === 'object' &&
        transaction !== null &&
        !Array.isArray(transaction) &&
        JSON.stringify(transaction).length <= MAX_TRANSACTION_JSON;

    if (
        (!hasSerialized && !hasJson) ||
        !Array.isArray(signatures) ||
        signatures.length === 0 ||
        signatures.length > 4 ||
        !signatures.every((s) => typeof s === 'string' && s.length < MAX_SIGNATURE_LENGTH)
    ) {
        return NextResponse.json({ error: 'Invalid login request' }, { status: 400 });
    }

    let actor: string;
    try {
        actor = await verifySignedChallenge({
            serializedTransaction: hasSerialized ? (serializedTransaction as string) : undefined,
            transaction: hasJson ? (transaction as Record<string, never>) : undefined,
            signatures: signatures as string[],
        });
    } catch (err) {
        if (err instanceof ChallengeError) {
            return NextResponse.json({ error: err.message }, { status: 401 });
        }
        console.error('Login verification failed:', err);
        return NextResponse.json({ error: 'Could not verify login right now' }, { status: 502 });
    }

    try {
        await createSession(actor);
        await clearChallenge();
        (await cookies()).delete('xpr_auth');
        return NextResponse.json({ actor });
    } catch (err) {
        console.error('Login session creation failed:', err);
        return NextResponse.json({ error: 'Login failed' }, { status: 500 });
    }
}
