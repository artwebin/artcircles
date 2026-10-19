import { formatContractError } from "@/lib/errors";
import { clearRpcCache } from "@/lib/rpc";

export type TransactionStatus =
  | "wallet"
  | "checking" // "Checking the network…"
  | "pending"  // Normal confirmation
  | "success"
  | "cancelled"
  | "ignored"
  | "contract_error"
  | "unconfirmed";

export interface RunTransactionOptions {
  circleId?: string | number;
  pollTimeoutMs?: number; // default 15000 (15s)
  pollIntervalMs?: number; // default 1000 (1s)
  onStatusChange?: (
    status: TransactionStatus,
    details?: { message?: string; txId?: string }
  ) => void;
}

export type RunTransactionResult =
  | { success: true; txId?: string; recovered?: boolean; data?: any }
  | { success: false; status: "cancelled"; message: string }
  | { success: false; status: "ignored" }
  | { success: false; status: "contract_error"; message: string; rawDetails?: string }
  | {
      success: false;
      status: "unconfirmed";
      message: string;
      circleId?: string | number;
      txId?: string;
    };

/**
 * Checks if the current session uses the in-browser WebAuth wallet popup
 * (which can be blocked by browser popup blockers), vs a mobile or desktop wallet app.
 */
export function isBrowserWebAuth(session: any): boolean {
  if (!session) return false;
  return session.link?.walletType === "webauth" || session.walletType === "webauth";
}

export function isTryingToLoginError(error: any): boolean {
  if (!error) return false;
  const msg = typeof error === "string" ? error : error.message || "";
  return /trying to login/i.test(msg);
}

/**
 * Checks for on-chain contract assertion failure (e.g. eosio_assert).
 */
export function isContractAssertionError(error: any): boolean {
  if (!error) return false;
  if (isTryingToLoginError(error)) return false;

  const msg = typeof error === "string" ? error : (typeof error.message === "string" ? error.message : "");
  if (/assertion failure|eosio_assert/i.test(msg)) return true;

  const jsonError = error.json?.error || error.error?.json?.error;
  if (jsonError) {
    if (jsonError.name?.includes("eosio_assert")) return true;
    if (jsonError.code === 3050003 || jsonError.code === 3050004) return true;
    if (jsonError.what && /assertion failure|eosio_assert/i.test(jsonError.what)) return true;
    if (Array.isArray(jsonError.details)) {
      for (const d of jsonError.details) {
        if (d.message && /assertion failure|eosio_assert/i.test(d.message)) return true;
      }
    }
  }
  return false;
}

/**
 * Checks ONLY error.code and error.message for user cancellation in wallet.
 * Explicitly does NOT inspect JSON.stringify(error) or error.json so that
 * contract errors containing words like 'cancel' are not misclassified.
 */
export function isCancelError(error: any): boolean {
  if (!error) return false;
  if (error.code === "E_CANCEL" || error.code === "E_WALLET_TYPE") return true;

  const msg = typeof error === "string" ? error : (typeof error.message === "string" ? error.message : "");
  if (!msg) return false;
  if (msg === "Closed") return true;
  if (/user closed|user rejected|cancelled in wallet|transaction cancelled|request rejected/i.test(msg)) {
    return true;
  }
  if (/\b(cancelled|canceled|rejected)\b/i.test(msg)) {
    return true;
  }
  // If message contains cancel or reject without being a contract phrase
  if (/\b(cancel|reject)\b/i.test(msg) && !/can cancel/i.test(msg)) {
    return true;
  }
  return false;
}

/**
 * Checks if the RPC node explicitly returned an error (CPU, expired, authorization, etc.).
 * This is a deterministic failure from the node.
 */
export function isNodeRejection(error: any): boolean {
  if (!error) return false;
  const jsonError = error.json?.error || error.error?.json?.error;
  return !!jsonError;
}

/**
 * Executes a transaction with unified error handling, status reporting,
 * and up to 15s on-chain polling recovery for unknown network/broadcast errors.
 */
export async function runTransaction(
  session: any,
  actions: any[],
  pollCondition?: () => Promise<any>,
  options?: RunTransactionOptions
): Promise<RunTransactionResult> {
  const pollTimeout = options?.pollTimeoutMs ?? 15000;
  const pollInterval = options?.pollIntervalMs ?? 1000;

  options?.onStatusChange?.("wallet");

  let txResult: any = null;
  let txError: any = null;

  try {
    txResult = await session.transact({ actions }, { broadcast: true });
  } catch (err: any) {
    txError = err;
  }

  // Handle errors from session.transact
  if (txError) {
    // 1. Trying to login: do nothing, ignore
    if (isTryingToLoginError(txError)) {
      options?.onStatusChange?.("ignored");
      return { success: false, status: "ignored" };
    }

    // 2. Contract assertion failure (checked BEFORE cancel!)
    if (isContractAssertionError(txError)) {
      const formatted = formatContractError(txError);
      options?.onStatusChange?.("contract_error", { message: formatted.message });
      return {
        success: false,
        status: "contract_error",
        message: formatted.message,
        rawDetails: formatted.rawDetails,
      };
    }

    // 3. Cancellation in wallet
    if (isCancelError(txError)) {
      const message = "You cancelled in your wallet. Nothing was sent.";
      options?.onStatusChange?.("cancelled", { message });
      return { success: false, status: "cancelled", message };
    }

    // 4. Node definitive rejection (CPU, expired, missing authority, etc.)
    if (isNodeRejection(txError)) {
      const formatted = formatContractError(txError);
      options?.onStatusChange?.("contract_error", { message: formatted.message });
      return {
        success: false,
        status: "contract_error",
        message: formatted.message,
        rawDetails: formatted.rawDetails,
      };
    }

    // 5. Everything else (NO response from the node, timeout, network drop, connection reset):
    // Enter "Checking the network…" state and poll pollCondition for up to 15s
    options?.onStatusChange?.("checking", { message: "Checking the network…" });

    if (pollCondition) {
      const startTime = Date.now();
      while (Date.now() - startTime < pollTimeout) {
        await new Promise((r) => setTimeout(r, pollInterval));
        try {
          const confirmed = await pollCondition();
          if (confirmed) {
            clearRpcCache();
            options?.onStatusChange?.("success");
            return { success: true, recovered: true, data: confirmed };
          }
        } catch {
          // ignore polling errors and keep retrying until timeout
        }
      }
    }

    // Condition was not met within 15 seconds
    const unconfirmedMsg = "We could not confirm this. Check the circle before you try again.";
    options?.onStatusChange?.("unconfirmed", { message: unconfirmedMsg });
    return {
      success: false,
      status: "unconfirmed",
      message: unconfirmedMsg,
      circleId: options?.circleId,
    };
  }

  // Transaction broadcast succeeded
  const txId = txResult?.processed?.id || txResult?.transaction_id || "";
  options?.onStatusChange?.("pending", { txId });

  if (pollCondition) {
    const startTime = Date.now();
    let confirmedData: any = null;
    let isConfirmed = false;

    while (Date.now() - startTime < pollTimeout) {
      try {
        const confirmed = await pollCondition();
        if (confirmed) {
          confirmedData = confirmed;
          isConfirmed = true;
          break;
        }
      } catch {
        // continue polling
      }
      await new Promise((r) => setTimeout(r, pollInterval));
    }

    if (isConfirmed) {
      clearRpcCache();
      options?.onStatusChange?.("success", { txId });
      return { success: true, txId, data: confirmedData };
    } else {
      const unconfirmedMsg = "We could not confirm this. Check the circle before you try again.";
      options?.onStatusChange?.("unconfirmed", { message: unconfirmedMsg, txId });
      return {
        success: false,
        status: "unconfirmed",
        message: unconfirmedMsg,
        circleId: options?.circleId,
        txId,
      };
    }
  }

  // If no pollCondition was provided, report immediate success
  clearRpcCache();
  options?.onStatusChange?.("success", { txId });
  return { success: true, txId, data: txResult };
}
