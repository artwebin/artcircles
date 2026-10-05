# artcircles

Rotating savings circles on XPR Network.

A savings circle is a small group of people who know each other. Every round, each member pays the same amount into a shared pot, and one member receives the whole pot. The circle ends when every member has received exactly once. Nobody pays interest and nobody earns it. Hundreds of millions of people already save this way under different names: tanda, susu, equb, hagbad, chit fund, gye. Most of them still keep track in notebooks, spreadsheets and group chats.

artcircles moves the bookkeeping on chain. The contract holds the money, enforces the agreed order and deadlines, and handles late or missing payments by rules everyone can read before they join.

> **Status: testnet only.** The contract is deployed on XPR Network testnet as `artcircles`. It has not been independently audited. Do not use it with real funds.

## Why XPR Network

Savings circles have been tried on other chains and mostly stayed demos, for three reasons that XPR Network removes:

- **Fees.** A monthly payment of 20 makes no sense with a 5 transaction fee. XPR Network has no transaction fees.
- **Anonymity.** On most chains a member who takes the pot and stops paying is just an address. XPR Network has on-chain KYC, and a circle can require every member to be verified.
- **Usability.** Members invite each other by account name (`@alice`) and sign with WebAuth instead of copying hex addresses.

## How a circle works

1. **Create.** The organizer creates a circle: round amount (XUSDC), number of members (2 to 50), round length (1 to 90 days), deposit size (1 to 3 rounds), and whether KYC is required.
2. **Join.** Each member joins with a single transfer of the deposit. Members can leave and get their deposit back until the circle starts.
3. **Agree on the order.** Once the circle is full, the organizer proposes the payout order. Every member must approve it with their own signature. Any change to the order clears all approvals.
4. **Start.** The organizer starts the circle once everyone has approved.
5. **Pay and receive.** Every round, every member pays the round amount. When everyone has paid, or when the round deadline has passed, anyone can trigger the payout and the member whose turn it is receives the pot.
6. **Complete.** After the last round, the contract refunds all remaining deposits and records each member's reputation.

The round schedule is fixed at start. If a round is paid out early, the next deadline does not move.

## Late and missing payments

Payout before the deadline waits for every member. After the deadline:

- **A member did not pay and has a deposit.** The missing payment is taken from their deposit. The pot is paid in full. The member can refill the deposit later.
- **A member did not pay and has no deposit left.** The member is marked as defaulted and takes on debt. The pot for that round is smaller, so the loss falls on the members who are still waiting for their turn, and on nobody else.
- **The recipient did not pay.** Their own share is simply netted from the pot they receive.
- **A defaulted member's turn comes.** Their debt is withheld from their pot. The withheld amount is returned at completion to the members who received a short pot, in proportion to what they lost.

The result: not paying never pays off. A member who defaults after receiving keeps exactly what they took and nothing more. A member who defaults before receiving ends up with nothing extra, and the members they shorted are made whole.

## Reputation

When a circle completes, every member's record in the `reputation` table is updated: completed circles, missed payments, and defaults. The record follows the account across all circles.

## Using the contract

All payments are plain XUSDC transfers to `artcircles` with a memo. The contract never asks for permission changes. **If anything claiming to be artcircles asks you to change your account permissions, it is not artcircles.**

| Memo | Purpose |
|---|---|
| `join:<id>` | Join circle `<id>` with the deposit |
| `pay:<id>` | Pay the current round of circle `<id>` |
| `topup:<id>` | Refill a used deposit |

Any other memo, a wrong amount, or a token other than XUSDC from `xtokens` is rejected, and the whole transfer is reverted.

| Action | Who | Description |
|---|---|---|
| `create` | organizer | Create a circle |
| `setorder` | organizer | Propose the payout order (circle must be full) |
| `approve` | member | Approve the proposed order |
| `start` | organizer | Start the circle (full, ordered, approved by all) |
| `payout` | anyone | Pay out the current round |
| `leave` | member | Leave before start, deposit refunded |
| `cancel` | organizer | Cancel before start, all deposits refunded |

## Trust model

- The contract only accepts transfers. It never needs any permission on a member's account.
- Payouts can be triggered by anyone, so a circle keeps working even if the operator disappears.
- Every circle, member, payment and payout is public on chain.
- The code is open source and covered by tests for every rule above.

Planned before mainnet:

- Control of the contract account moves to a multisig of independent block producers with a time delay on upgrades.
- Independent code review and a bug bounty.
- Check that the KYC provider of a member is not blacklisted.

## Development

Requires Node.js 18 or newer.

```bash
npm install
npm test
```

`npm test` builds the contract and a test mock of `eosio.proton`, then runs the full test suite against a local chain emulator ([@proton/vert](https://www.npmjs.com/package/@proton/vert)). No testnet access is needed.

Built with [proton-tsc](https://www.npmjs.com/package/proton-tsc) 0.3.58.

## License

MIT

---

Built by [artwebin](https://bp.artwebin.com), block producer on XPR Network.
