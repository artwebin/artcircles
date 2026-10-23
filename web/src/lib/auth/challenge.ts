import 'server-only';
import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { ABI, Action, Authority, Bytes, KeyType, PublicKey, Serializer, Signature, Transaction } from '@greymass/eosio';
import { isValidAccountName } from './account';
import { parseWebAuthnSignature, WebAuthnError, webAuthnKeyMatches } from './webauthn';
import { CHAIN_ID } from '@/lib/config';
import { RPC_ENDPOINTS } from '@/lib/rpc';

/*
 * Login flow (challenge-response, modelled on xprotect.org):
 * 1. GET /api/auth/nonce issues a random nonce for an account and stores it in a signed,
 *    httpOnly cookie that expires after five minutes.
 * 2. The wallet signs, without broadcasting, a transaction with a single action
 *    AUTH_CONTRACT::verify { account, verify_token: "<AUTH_DOMAIN>:<nonce>" }.
 * 3. POST /api/auth/login receives the full signed transaction (serialized, or as JSON from
 *    wallets that return it that way). The server checks the transaction content, recovers the
 *    signing key (K1 or WebAuthn) and checks it against the account's on-chain permission.
 *    Nothing is ever sent to the chain.
 */

export const AUTH_CONTRACT = process.env.AUTH_CONTRACT || (process.env.NEXT_PUBLIC_CHAIN === 'testnet' ? 'artcircles' : 'xsign');
export const AUTH_ACTION = 'verify';
export const TOKEN_PREFIX = `${process.env.AUTH_DOMAIN || 'circles.artwebin.com'}:`;

const NONCE_COOKIE = 'xc_challenge';
const NONCE_TTL_SECONDS = 300;

export class ChallengeError extends Error {}

function getSecret(): Uint8Array {
    const raw = process.env.SESSION_SECRET;
    if (!raw || raw.length < 32) {
        throw new Error('SESSION_SECRET must be set and at least 32 characters long');
    }
    return new TextEncoder().encode(raw);
}

// Best-effort single-use guard for nonces (per server instance); the cookie is also cleared on success.
const usedNonces = new Map<string, number>();

function markNonceUsed(nonce: string): boolean {
    const now = Date.now();
    for (const [key, expiry] of usedNonces) {
        if (expiry < now) usedNonces.delete(key);
    }
    if (usedNonces.has(nonce)) return false;
    usedNonces.set(nonce, now + NONCE_TTL_SECONDS * 1000);
    return true;
}

export async function issueChallenge(actor: string): Promise<{ nonce: string; verifyToken: string }> {
    const nonce = randomBytes(16).toString('hex');
    const token = await new SignJWT({ nonce })
        .setSubject(actor)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(`${NONCE_TTL_SECONDS}s`)
        .sign(getSecret());

    (await cookies()).set(NONCE_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/auth',
        maxAge: NONCE_TTL_SECONDS,
    });

    return { nonce, verifyToken: `${TOKEN_PREFIX}${nonce}` };
}

async function readChallenge(): Promise<{ actor: string; nonce: string }> {
    const token = (await cookies()).get(NONCE_COOKIE)?.value;
    if (!token) throw new ChallengeError('Login request expired. Please try again.');
    try {
        const { payload } = await jwtVerify(token, getSecret(), { algorithms: ['HS256'] });
        if (!isValidAccountName(payload.sub) || typeof payload.nonce !== 'string') {
            throw new ChallengeError('Invalid login request.');
        }
        return { actor: payload.sub, nonce: payload.nonce };
    } catch (err) {
        if (err instanceof ChallengeError) throw err;
        throw new ChallengeError('Login request expired. Please try again.');
    }
}

export async function clearChallenge(): Promise<void> {
    (await cookies()).delete({ name: NONCE_COOKIE, path: '/api/auth' });
}

async function rpc<T>(path: string, body: unknown): Promise<T> {
    let lastError: unknown = null;
    for (const endpoint of RPC_ENDPOINTS) {
        try {
            const res = await fetch(`${endpoint}${path}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                cache: 'no-store',
                signal: AbortSignal.timeout(5000),
            });
            if (!res.ok) {
                lastError = new Error(`${path} failed with status ${res.status}`);
                continue;
            }
            return (await res.json()) as T;
        } catch (err) {
            lastError = err;
        }
    }
    throw lastError ?? new Error('No RPC endpoint available');
}

let cachedAbi: { abi: ABI; fetchedAt: number } | null = null;

async function getAuthContractAbi(): Promise<ABI> {
    if (cachedAbi && Date.now() - cachedAbi.fetchedAt < 60 * 60 * 1000) return cachedAbi.abi;
    const res = await rpc<{ abi?: unknown }>('/v1/chain/get_abi', { account_name: AUTH_CONTRACT });
    if (!res.abi) throw new Error(`No ABI found for ${AUTH_CONTRACT}`);
    const abi = ABI.from(res.abi as never);
    cachedAbi = { abi, fetchedAt: Date.now() };
    return abi;
}

type ChainPermission = {
    perm_name: string;
    required_auth: {
        threshold: number;
        keys: { key: string; weight: number }[];
        accounts: { permission: { actor: string; permission: string }; weight: number }[];
        waits: { wait_sec: number; weight: number }[];
    };
};

type TransactionJson = {
    expiration?: unknown;
    ref_block_num?: unknown;
    ref_block_prefix?: unknown;
    max_net_usage_words?: unknown;
    max_cpu_usage_ms?: unknown;
    delay_sec?: unknown;
    context_free_actions?: unknown[];
    actions?: { account?: unknown; name?: unknown; authorization?: unknown; data?: unknown }[];
    transaction_extensions?: unknown[];
};

/** Rebuilds a transaction from wallet JSON; action data that is not hex is encoded with the auth contract ABI. */
async function transactionFromJson(json: TransactionJson): Promise<Transaction> {
    const actions = await Promise.all(
        (json.actions ?? []).map(async (action) => {
            if (typeof action.data === 'string') return Action.from(action as never);
            if (action.account !== AUTH_CONTRACT) throw new Error('Unexpected action');
            return Action.from(action as never, await getAuthContractAbi());
        })
    );
    return Transaction.from({
        expiration: json.expiration as never,
        ref_block_num: json.ref_block_num as never,
        ref_block_prefix: json.ref_block_prefix as never,
        max_net_usage_words: (json.max_net_usage_words ?? 0) as never,
        max_cpu_usage_ms: (json.max_cpu_usage_ms ?? 0) as never,
        delay_sec: (json.delay_sec ?? 0) as never,
        context_free_actions: (json.context_free_actions ?? []) as never,
        actions,
        transaction_extensions: (json.transaction_extensions ?? []) as never,
    });
}

/**
 * Finds the account key behind one signature: recovered for K1/R1 signatures, matched against the
 * permission's WA keys for WebAuthn signatures. Returns null for a signature that cannot be used.
 */
function signingKey(raw: string, digest: ReturnType<Transaction['signingDigest']>, authority: Authority): PublicKey | null {
    try {
        const signature = Signature.from(raw);
        if (signature.type !== KeyType.WA) return signature.recoverDigest(digest);

        const assertion = parseWebAuthnSignature(signature, digest);
        const match = authority.keys.find((entry) => webAuthnKeyMatches(assertion, entry.key));
        return match ? match.key : null;
    } catch (err) {
        if (err instanceof WebAuthnError) console.warn(`[auth] WebAuthn signature rejected: ${err.message}`);
        return null;
    }
}

/**
 * Verifies the signed login transaction against the nonce cookie and the account's
 * on-chain keys. Returns the verified account name.
 */
export async function verifySignedChallenge(input: {
    serializedTransaction?: string;
    transaction?: TransactionJson;
    signatures: string[];
}): Promise<string> {
    const { actor, nonce } = await readChallenge();

    let tx: Transaction;
    try {
        tx = input.serializedTransaction
            ? (Serializer.decode({ data: Bytes.from(input.serializedTransaction, 'hex'), type: Transaction }) as Transaction)
            : await transactionFromJson(input.transaction ?? {});
    } catch {
        throw new ChallengeError('Malformed transaction.');
    }

    // The transaction must contain exactly one action: AUTH_CONTRACT::verify by the account itself
    if (tx.context_free_actions.length !== 0 || tx.actions.length !== 1) {
        throw new ChallengeError('Unexpected transaction content.');
    }
    const action = tx.actions[0];
    if (action.account.toString() !== AUTH_CONTRACT || action.name.toString() !== AUTH_ACTION) {
        throw new ChallengeError('Unexpected action.');
    }
    if (action.authorization.length !== 1 || action.authorization[0].actor.toString() !== actor) {
        throw new ChallengeError('The transaction is not signed by the requested account.');
    }
    const permission = action.authorization[0].permission.toString();

    const abi = await getAuthContractAbi();
    let data: { account?: string; verify_token?: string };
    try {
        data = Serializer.objectify(action.decodeData(abi));
    } catch {
        throw new ChallengeError('Malformed transaction.');
    }
    if (data.account !== actor || data.verify_token !== `${TOKEN_PREFIX}${nonce}`) {
        throw new ChallengeError('The signed login request does not match.');
    }

    // Freshness comes from the single-use nonce (signed cookie with a short TTL), not from the
    // transaction expiration: the transaction is never broadcast and wallets choose their own
    // expiration (some use a placeholder), so it is only logged for diagnostics.
    const deltaSeconds = Math.round((tx.expiration.toMilliseconds() - Date.now()) / 1000);
    console.info(`[auth] ${actor} login tx expiration: ${tx.expiration.toString()} (${deltaSeconds}s from now)`);

    if (!markNonceUsed(nonce)) {
        throw new ChallengeError('This login request was already used.');
    }

    const account = await rpc<{ permissions?: ChainPermission[] }>('/v1/chain/get_account', { account_name: actor });
    const perm = account.permissions?.find((p) => p.perm_name === permission);
    if (!perm) throw new ChallengeError('Unknown account permission.');
    const authority = Authority.from(perm.required_auth);

    const digest = tx.signingDigest(CHAIN_ID);
    const signedBy = input.signatures.some((raw) => {
        const key = signingKey(raw, digest, authority);
        return key !== null && authority.hasPermission(key);
    });

    if (!signedBy) {
        throw new ChallengeError('The signature does not match the account keys.');
    }

    return actor;
}
