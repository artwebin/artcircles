/**
 * Normalizes what wallets return from `transact({ broadcast: false })` into the login request body.
 *
 * Link-based wallets (WebAuth mobile, Anchor) return greymass objects. The WebAuth browser wallet
 * (webauth.com popup) returns plain JSON, where byte arrays may arrive as hex strings, number arrays
 * or index-keyed objects, and the transaction may only be available as JSON.
 */

export type SignedLoginRequest = {
    serializedTransaction?: string;
    transaction?: Record<string, unknown>;
    signatures: string[];
};

type AnyRecord = Record<string, unknown>;

function isRecord(value: unknown): value is AnyRecord {
    return typeof value === "object" && value !== null;
}

function hexFromBytes(bytes: ArrayLike<number>): string {
    let hex = "";
    for (let i = 0; i < bytes.length; i++) hex += (bytes[i] & 0xff).toString(16).padStart(2, "0");
    return hex;
}

function isByteArray(value: unknown[]): value is number[] {
    return value.length > 0 && value.every((n) => Number.isInteger(n) && (n as number) >= 0 && (n as number) < 256);
}

/** Converts the common byte representations to a hex string; returns null for anything else. */
export function toHex(value: unknown): string | null {
    if (typeof value === "string") {
        return value.length > 0 && value.length % 2 === 0 && /^[0-9a-f]+$/i.test(value) ? value.toLowerCase() : null;
    }
    if (value instanceof Uint8Array) return value.length ? hexFromBytes(value) : null;
    if (Array.isArray(value)) return isByteArray(value) ? hexFromBytes(value) : null;
    if (isRecord(value)) {
        // greymass Bytes
        if (typeof value.hexString === "string") return toHex(value.hexString);
        if (value.array instanceof Uint8Array) return toHex(value.array);
        // Node Buffer serialized to JSON
        if (value.type === "Buffer" && Array.isArray(value.data)) return toHex(value.data);
        // Uint8Array serialized to JSON: {"0": 12, "1": 34, ...}
        const keys = Object.keys(value);
        if (keys.length > 0 && keys.every((key, index) => key === String(index))) {
            return toHex(keys.map((key) => value[key]));
        }
    }
    return null;
}

function toSignatureStrings(value: unknown): string[] {
    const list = Array.isArray(value) ? value : value ? [value] : [];
    return list
        .map((sig) => (typeof sig === "string" ? sig : isRecord(sig) && typeof sig.toString === "function" ? sig.toString() : ""))
        .filter((sig) => sig.startsWith("SIG_"));
}

/** Short description of the result (keys and value types only, never values) for diagnostics. */
export function describeShape(value: unknown, depth = 0): unknown {
    if (Array.isArray(value)) return depth > 1 ? `array(${value.length})` : [`array(${value.length})`, describeShape(value[0], depth + 1)];
    if (value instanceof Uint8Array) return `Uint8Array(${value.length})`;
    if (isRecord(value)) {
        if (depth > 1) return `object(${value.constructor?.name ?? "Object"})`;
        const out: AnyRecord = { _type: value.constructor?.name ?? "Object" };
        Object.keys(value).slice(0, 25).forEach((key) => {
            out[key] = describeShape(value[key], depth + 1);
        });
        return out;
    }
    return typeof value;
}

export async function toSignedLoginRequest(result: unknown): Promise<SignedLoginRequest> {
    if (!isRecord(result)) throw new Error("The wallet returned an empty response.");

    const nested = [result, result.resolved, result.transaction].filter(isRecord);

    const signatures =
        nested.map((source) => toSignatureStrings(source.signatures ?? source.signature)).find((list) => list.length > 0) ?? [];
    if (signatures.length === 0) throw new Error("The wallet did not return a signature.");

    // 1. A serialized transaction in any byte representation
    for (const source of nested) {
        for (const key of ["serializedTransaction", "serialized_transaction", "packed_trx", "packedTransaction"]) {
            const hex = toHex(source[key]);
            if (hex) return { serializedTransaction: hex, signatures };
        }
    }

    // 2. A greymass Transaction object (Link-based wallets)
    const transaction = (result.transaction ?? result.resolvedTransaction) as unknown;
    if (isRecord(transaction)) {
        try {
            const { Serializer, Transaction } = await import("@greymass/eosio");
            if (transaction instanceof Transaction) {
                return { serializedTransaction: Serializer.encode({ object: transaction }).hexString, signatures };
            }
        } catch {
            // Fall through to the JSON form
        }

        // 3. Plain JSON; the server rebuilds and serializes it
        const json = JSON.parse(JSON.stringify(transaction)) as AnyRecord;
        if (Array.isArray(json.actions)) return { transaction: json, signatures };
    }

    throw new Error("The wallet response did not include the signed transaction.");
}
