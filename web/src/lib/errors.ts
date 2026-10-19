/**
 * Maps on-chain contract assertion failures and node errors to plain-language,
 * user-friendly messages as specified in the XPR Circles specification.
 */
export function formatContractError(error: any): { message: string; rawDetails?: string } {
  if (!error) {
    return { message: "An unknown error occurred" };
  }

  // 1. Try to extract message from structured node error if available
  const jsonError = error?.json?.error || error?.error?.json?.error;
  let rawMsg = error?.message;

  if (jsonError) {
    if (Array.isArray(jsonError.details)) {
      for (const d of jsonError.details) {
        if (d.message) {
          rawMsg = d.message;
          break;
        }
      }
    }
    if (!rawMsg && jsonError.what) {
      rawMsg = jsonError.what;
    }
  }

  if (!rawMsg) {
    rawMsg = typeof error === "string" ? error : JSON.stringify(error);
  }

  // 2. Check for contract assertion failure
  const assertionMatch = rawMsg.match(/assertion failure with message:\s*(.+)/i);
  if (assertionMatch) {
    const contractText = assertionMatch[1].trim();

    if (/Only the organizer can cancel/i.test(contractText)) {
      return { message: "Only the organizer can cancel", rawDetails: rawMsg };
    }
    if (/Circle is full/i.test(contractText)) {
      return { message: "This circle has no free seats left.", rawDetails: rawMsg };
    }
    if (/Circle is not accepting members/i.test(contractText)) {
      return { message: "This circle has already started or was cancelled.", rawDetails: rawMsg };
    }
    if (/Already a member/i.test(contractText)) {
      return { message: "You are already in this circle.", rawDetails: rawMsg };
    }
    if (/Deposit must equal the required amount/i.test(contractText)) {
      return { message: "The deposit must match the required amount.", rawDetails: rawMsg };
    }
    if (/This circle requires KYC verified members/i.test(contractText)) {
      return { message: "This circle is only for verified accounts.", rawDetails: rawMsg };
    }
    if (/Already paid for this round/i.test(contractText)) {
      return { message: "You have already paid this round.", rawDetails: rawMsg };
    }
    if (/Payment must equal the round amount/i.test(contractText)) {
      return { message: "The payment must match the round amount.", rawDetails: rawMsg };
    }
    if (/Top-up must equal the missing deposit/i.test(contractText)) {
      return { message: "The top-up must match the missing deposit amount.", rawDetails: rawMsg };
    }
    if (/Deposit is already full/i.test(contractText)) {
      return { message: "Your deposit is already complete.", rawDetails: rawMsg };
    }

    const waitingPayMatch = contractText.match(/Waiting for payment from\s+([a-z1-5.]+)/i);
    if (waitingPayMatch) {
      return { message: `Not everyone has paid yet: @${waitingPayMatch[1]}.`, rawDetails: rawMsg };
    }

    const waitingApprovalMatch = contractText.match(/Waiting for approval from\s+([a-z1-5.]+)/i);
    if (waitingApprovalMatch) {
      return { message: `@${waitingApprovalMatch[1]} has not approved the order yet.`, rawDetails: rawMsg };
    }

    if (/Order has not been set yet/i.test(contractText)) {
      return { message: "The organizer has not set the order yet.", rawDetails: rawMsg };
    }

    // Default assertion message
    return {
      message: contractText,
      rawDetails: rawMsg !== contractText ? rawMsg : undefined,
    };
  }

  // 3. Structured node rejection errors (CPU limit, expired, missing authority)
  if (jsonError?.what) {
    if (/billed CPU time greater than max/i.test(jsonError.what)) {
      return { message: "Transaction exceeded CPU resource limits.", rawDetails: rawMsg };
    }
    if (/transaction has expired/i.test(jsonError.what)) {
      return { message: "Transaction expired before it could be processed.", rawDetails: rawMsg };
    }
    if (/unsatisfied_authorization|missing required authority/i.test(jsonError.what)) {
      return { message: "Missing required account authority.", rawDetails: rawMsg };
    }
    return { message: jsonError.what, rawDetails: rawMsg };
  }

  // 4. Wallet cancellation
  if (/user closed|user rejected|transaction cancelled|cancelled in wallet/i.test(rawMsg)) {
    return { message: "The transaction was cancelled in your wallet.", rawDetails: rawMsg };
  }

  // Fallback
  return {
    message: rawMsg || "Transaction failed",
  };
}
