import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getReputation, getAccountInfo, getChainAccount, getMyCircles } from "@/lib/rpc";
import { getReputationCopy } from "@/lib/reputation";
import { ProfileView } from "@/components/ProfileView";
import { RpcErrorView } from "@/components/RpcErrorView";
import { Footer } from "@/components/layout/Footer";

export const dynamic = "force-dynamic";

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ account: string }> 
}): Promise<Metadata> {
  const resolvedParams = await params;
  const account = resolvedParams.account;

  if (!/^[a-z1-5.]{1,12}$/.test(account)) {
    return { title: "Account not found", robots: { index: false } };
  }

  try {
    const [reputation, circles, chainAccount] = await Promise.all([
      getReputation(account),
      getMyCircles(account),
      getChainAccount(account),
    ]);

    if (!chainAccount.exists) {
      return { title: "Account not found", robots: { index: false } };
    }

    const { sentence } = getReputationCopy(
      reputation.completed,
      reputation.missed,
      reputation.defaulted
    );

    let earliestSec: number | null = null;
    circles.forEach((c: any) => {
      if (c.organizer === account && c.created) {
        if (earliestSec === null || c.created < earliestSec) earliestSec = c.created;
      }
      const myMem = c.membersList?.find((m: any) => m.account === account);
      if (myMem && myMem.joined) {
        if (earliestSec === null || myMem.joined < earliestSec) earliestSec = myMem.joined;
      }
    });

    const sinceStr = earliestSec
      ? new Date(earliestSec * 1000).toLocaleDateString("en-US", { month: "short", year: "numeric" })
      : null;

    const description = sinceStr
      ? `${sentence} In XPR Circles since ${sinceStr}.`
      : `${sentence} In XPR Circles.`;

    return {
      title: `${account} on XPR Circles`,
      description,
      robots: { index: false },
    };
  } catch (e) {
    return {
      title: `${account} on XPR Circles`,
      robots: { index: false },
    };
  }
}

export default async function AccountPage({ 
  params 
}: { 
  params: Promise<{ account: string }> 
}) {
  const resolvedParams = await params;
  const account = resolvedParams.account;

  // 1. Validate route parameter format
  if (!/^[a-z1-5.]{1,12}$/.test(account)) {
    notFound();
  }

  // 2. Fetch all public chain data in parallel with failover and RPC error catching
  let reputation, userInfo, chainAccount, circles;
  try {
    [reputation, userInfo, chainAccount, circles] = await Promise.all([
      getReputation(account),
      getAccountInfo(account),
      getChainAccount(account),
      getMyCircles(account),
    ]);
  } catch (err: any) {
    // If all endpoints failed or timed out, display network error with Retry
    return (
      <>
        <main style={{ minHeight: "calc(100vh - 140px)" }}>
          <RpcErrorView />
        </main>
        <Footer slim />
      </>
    );
  }

  // 3. If account does not exist on chain, trigger 404
  if (!chainAccount.exists) {
    notFound();
  }

  return (
    <>
      <main style={{ minHeight: "calc(100vh - 140px)" }}>
        <ProfileView
          account={account}
          reputation={reputation}
          userInfo={userInfo}
          accountCreated={chainAccount.created}
          circles={circles}
        />
      </main>
      <Footer slim />
    </>
  );
}

