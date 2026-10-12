/**
 * Maps on-chain contract assertion failures to plain-language, user-friendly messages
 * as specified in the XPR Circles specification.
 */
export function formatContractError(error: any): { message: string; rawDetails?: string } {
  if (!error) {
    return { message: "An unknown error occurred" };
  }

  const rawMsg = error?.message || (typeof error === "string" ? error : JSON.stringify(error));
  const assertionMatch = rawMsg.match(/assertion failure with message:\s*(.+)/i);
  const contractText = assertionMatch ? assertionMatch[1].trim() : rawMsg;

  // User cancelled or closed the wallet signature
  if (/cancelled|rejected|user closed|user rejected/i.test(contractText)) {
    return { message: "The transaction was cancelled in your wallet.", rawDetails: rawMsg };
  }

  // Exact specification mappings from artcircles frontend brief:
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

  // Fallback
  return { 
    message: contractText || "Transaction failed", 
    rawDetails: rawMsg !== contractText ? rawMsg : undefined 
  };
}
