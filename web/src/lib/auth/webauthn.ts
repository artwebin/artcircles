import 'server-only';
import { createHash } from 'crypto';
import { Bytes, Checksum256, KeyType, PublicKey, Signature } from '@greymass/eosio';

/*
 * WebAuthn (WA) signature checks, following the chain's rules (fc::crypto::webauthn) and the
 * XPR Network SDK (@proton/js):
 *
 * Signature data: compact_signature (65 bytes, secp256r1) | varuint auth_data length | auth_data
 *                 | varuint client_json length | client_json
 * Public key data: compressed secp256r1 key (33 bytes) | user presence (1 byte) | varuint rpid length | rpid
 *
 * - client_json.type must be "webauthn.get"
 * - client_json.challenge (base64url) must be the transaction signing digest
 * - rpid is the host of client_json.origin, which must start with https://
 * - auth_data starts with sha256(rpid); byte 32 holds the user presence flags
 * - the secp256r1 signature is over sha256(auth_data || sha256(client_json))
 * - the key matches when the r1 key and rpid are equal and the signed presence level is at least
 *   the level the key requires
 */

const COMPACT_SIGNATURE_SIZE = 65;
const COMPRESSED_KEY_SIZE = 33;
const MIN_AUTH_DATA_SIZE = 37;

const USER_PRESENCE_NONE = 0;
const USER_PRESENCE_PRESENT = 1;
const USER_PRESENCE_VERIFIED = 2;

export class WebAuthnError extends Error {}

export interface WebAuthnAssertion {
    /** The secp256r1 signature in compact form. */
    r1Signature: Signature;
    /** What the authenticator actually signed: sha256(auth_data || sha256(client_json)). */
    signedDigest: Checksum256;
    rpid: string;
    presence: number;
}

function readVaruint32(bytes: Uint8Array, start: number): { value: number; next: number } {
    let value = 0;
    let shift = 0;
    let offset = start;
    for (;;) {
        if (offset >= bytes.length) throw new WebAuthnError('Truncated WebAuthn data.');
        const byte = bytes[offset++];
        value |= (byte & 0x7f) << shift;
        if ((byte & 0x80) === 0) break;
        shift += 7;
        if (shift > 28) throw new WebAuthnError('Invalid length in WebAuthn data.');
    }
    return { value: value >>> 0, next: offset };
}

function readSized(bytes: Uint8Array, start: number): { data: Uint8Array; next: number } {
    const { value, next } = readVaruint32(bytes, start);
    const end = next + value;
    if (end > bytes.length) throw new WebAuthnError('Truncated WebAuthn data.');
    return { data: bytes.subarray(next, end), next: end };
}

function sha256(...parts: Uint8Array[]): Buffer {
    const hash = createHash('sha256');
    parts.forEach((part) => hash.update(part));
    return hash.digest();
}

/** Host part of an https origin, without the port (same as the chain's rpid derivation). */
function rpidFromOrigin(origin: unknown): string {
    if (typeof origin !== 'string' || !origin.startsWith('https://')) {
        throw new WebAuthnError('WebAuthn origin must begin with https://');
    }
    let host = origin.slice('https://'.length);
    const colon = host.lastIndexOf(':');
    if (colon !== -1) host = host.slice(0, colon);
    if (!host || /[/\s]/.test(host)) throw new WebAuthnError('Invalid WebAuthn origin.');
    return host;
}

/**
 * Parses a WA signature and checks that it commits to `digest` for the origin it names.
 * Throws WebAuthnError when the signature is malformed or signed something else.
 */
export function parseWebAuthnSignature(signature: Signature, digest: Checksum256): WebAuthnAssertion {
    if (signature.type !== KeyType.WA) throw new WebAuthnError('Not a WebAuthn signature.');
    const bytes = signature.data.array;
    if (bytes.length <= COMPACT_SIGNATURE_SIZE) throw new WebAuthnError('Truncated WebAuthn signature.');

    const compact = Uint8Array.from(bytes.subarray(0, COMPACT_SIGNATURE_SIZE));
    const auth = readSized(bytes, COMPACT_SIGNATURE_SIZE);
    const client = readSized(bytes, auth.next);
    if (client.next !== bytes.length) throw new WebAuthnError('Unexpected data in WebAuthn signature.');

    const authData = auth.data;
    const clientJsonBytes = client.data;

    let clientData: { type?: unknown; challenge?: unknown; origin?: unknown };
    try {
        clientData = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(clientJsonBytes));
    } catch {
        throw new WebAuthnError('Invalid WebAuthn client data.');
    }
    if (clientData?.type !== 'webauthn.get') throw new WebAuthnError('WebAuthn signature is not an assertion.');
    if (typeof clientData.challenge !== 'string') throw new WebAuthnError('Missing WebAuthn challenge.');

    // The challenge binds the passkey signature to this exact transaction
    const challenge = Buffer.from(clientData.challenge, 'base64url');
    if (!challenge.equals(Buffer.from(digest.array))) throw new WebAuthnError('Wrong WebAuthn challenge.');

    const rpid = rpidFromOrigin(clientData.origin);
    if (authData.length < MIN_AUTH_DATA_SIZE) throw new WebAuthnError('WebAuthn auth data is too short.');
    if (!sha256(new TextEncoder().encode(rpid)).equals(Buffer.from(authData.subarray(0, 32)))) {
        throw new WebAuthnError('WebAuthn rpid does not match the origin.');
    }

    const flags = authData[32];
    let presence = USER_PRESENCE_NONE;
    if (flags & 0x01) presence = USER_PRESENCE_PRESENT;
    if (flags & 0x04) presence = USER_PRESENCE_VERIFIED;

    return {
        r1Signature: new Signature(KeyType.R1, Bytes.from(compact)),
        signedDigest: Checksum256.from(Uint8Array.from(sha256(authData, sha256(clientJsonBytes)))),
        rpid,
        presence,
    };
}

/** True when `key` is a WA key that produced `assertion`. */
export function webAuthnKeyMatches(assertion: WebAuthnAssertion, key: PublicKey): boolean {
    if (key.type !== KeyType.WA) return false;
    try {
        const data = key.data.array;
        if (data.length < COMPRESSED_KEY_SIZE + 2) return false;
        const compressed = Uint8Array.from(data.subarray(0, COMPRESSED_KEY_SIZE));
        const requiredPresence = data[COMPRESSED_KEY_SIZE];
        const rpidField = readSized(data, COMPRESSED_KEY_SIZE + 1);
        const keyRpid = new TextDecoder().decode(rpidField.data);

        if (keyRpid !== assertion.rpid) return false;
        if (assertion.presence < requiredPresence) return false;

        const r1Key = new PublicKey(KeyType.R1, Bytes.from(compressed));
        return assertion.r1Signature.verifyDigest(assertion.signedDigest, r1Key);
    } catch {
        return false;
    }
}
