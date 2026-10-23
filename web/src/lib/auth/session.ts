import 'server-only';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import { isValidAccountName } from './account';

const COOKIE_NAME = 'xc_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export class AuthError extends Error {
    constructor(public status: 401 | 403, message: string) {
        super(message);
    }
}

function getSecret(): Uint8Array {
    const raw = process.env.SESSION_SECRET || (process.env.NODE_ENV !== 'production' ? 'dev-session-secret-must-be-at-least-32-chars-long-xpr-circles' : undefined);
    if (!raw || raw.length < 32) {
        throw new Error('SESSION_SECRET must be set and at least 32 characters long');
    }
    return new TextEncoder().encode(raw);
}

export async function createSession(actor: string): Promise<void> {
    const token = await new SignJWT({})
        .setSubject(actor)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(`${MAX_AGE_SECONDS}s`)
        .sign(getSecret());

    (await cookies()).set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: MAX_AGE_SECONDS,
    });
}

export async function destroySession(): Promise<void> {
    (await cookies()).delete(COOKIE_NAME);
}

/** Returns the verified account of the current request, or null. */
export async function getSessionActor(): Promise<string | null> {
    const token = (await cookies()).get(COOKIE_NAME)?.value;
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(token, getSecret(), { algorithms: ['HS256'] });
        return isValidAccountName(payload.sub) ? payload.sub : null;
    } catch {
        return null;
    }
}

export async function requireUser(): Promise<{ actor: string }> {
    const actor = await getSessionActor();
    if (!actor) throw new AuthError(401, 'You must be logged in.');
    return { actor };
}

/** Converts an AuthError into a JSON response for API route handlers. */
export function authErrorResponse(err: unknown): NextResponse | null {
    if (err instanceof AuthError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return null;
}
