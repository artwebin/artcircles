import { formatContractError } from "@/lib/errors";

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

export function isCancelError(error: any): boolean {
  if (!error) return false;
  if (error.code === "E_CANCEL" || error.code === "E_WALLET_TYPE") return true;
  if (error.message === "Closed") return true;
  const msg = typeof error === "string" ? error : error.message || error.reason || JSON.stringify(error);
  if (/cancel|reject|user closed|user rejected/i.test(msg)) {
    return true;
  }
  return false;
}

export function isTryingToLoginError(error: any): boolean {
  if (!error) return false;
  const msg = typeof error === "string" ? error : error.message || JSON.stringify(error);
  return /trying to login/i.test(msg);
}

export function isContractAssertionError(error: any): boolean {
  if (!error) return false;
  if (isCancelError(error) || isTryingToLoginError(error)) return false;
  const msg = typeof error === "string" ? error : error.message || error.reason || JSON.stringify(error);
  if (/assertion failure|eosio_assert/i.test(msg)) return true;
  if (error.json?.error?.name?.includes("eosio_assert")) return true;
  if (error.json?.error?.code === 3050003 || error.json?.error?.code === 3050004) return true;
  return false;
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

    // 2. Cancellation: E_CANCEL, E_WALLET_TYPE, 'Closed', cancel / reject
    if (isCancelError(txError)) {
      const message = "You cancelled in your wallet. Nothing was sent.";
      options?.onStatusChange?.("cancelled", { message });
      return { success: false, status: "cancelled", message };
    }

    // 3. Contract assertion failure: formatContractError
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

    // 4. Everything else (network drop, timeout, broadcast fail, unknown):
    // Enter "Checking the network…" state and poll pollCondition for up to 15s
    options?.onStatusChange?.("checking", { message: "Checking the network…" });

    if (pollCondition) {
      const startTime = Date.now();
      while (Date.now() - startTime < pollTimeout) {
        await new Promise((r) => setTimeout(r, pollInterval));
        try {
          const confirmed = await pollCondition();
          if (confirmed) {
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
  options?.onStatusChange?.("success", { txId });
  return { success: true, txId, data: txResult };
}
