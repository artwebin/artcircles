import { expect } from "chai";
import { Blockchain, mintTokens, expectToThrow, nameToBigInt } from "@proton/vert";
import { Name, TimePointSec } from "@greymass/eosio";

const bc = new Blockchain();
const circles = bc.createContract("artcircles", "target/artcircles.contract");
const xtokens = bc.createContract("xtokens", "node_modules/proton-tsc/external/xtokens/xtokens");
const proton = bc.createContract("eosio.proton", "mocks/target/eosio.proton.contract");
const [alice, bob, carol, dave, erin] = bc.createAccounts("alice", "bob", "carol", "dave", "erin");

const AMOUNT = "10.000000 XUSDC";
const WEEK = 86400 * 7;

const balance = (acc: string): string => {
  const rows = xtokens.tables.accounts(nameToBigInt(Name.from(acc))).getTableRows();
  return rows.length ? rows[0].balance : "0.000000 XUSDC";
};
const circle = (id = 0) => circles.tables.circles().getTableRows().find((c: any) => c.id === id);
const members = (id = 0) => circles.tables.members(BigInt(id)).getTableRows();
const join = (acc: string, memo = "join:0", qty = AMOUNT) =>
  xtokens.actions.transfer([acc, "artcircles", qty, memo]).send(`${acc}@active`);

// vert does not roll back state of failed transactions, so every test starts clean
beforeEach(async () => {
  bc.resetTables();
  await mintTokens(xtokens, "XUSDC", 6, 1000000, 1000, [alice, bob, carol, dave, erin]);
  await circles.actions.create(["alice", "Family", AMOUNT, 3, WEEK, false, 1]).send("alice@active");
});

describe("create", () => {
  it("creates a forming circle", () => {
    const c = circle();
    expect(c.organizer).to.equal("alice");
    expect(c.amount).to.equal(AMOUNT);
    expect(c.state).to.equal(0);
    expect(c.members).to.equal(0);
  });
  it("requires organizer auth", async () => {
    await expectToThrow(
      circles.actions.create(["alice", "X", AMOUNT, 3, WEEK, false, 1]).send("bob@active"),
      "missing required authority alice"
    );
  });
  it("rejects non-XUSDC amounts", async () => {
    await expectToThrow(
      circles.actions.create(["alice", "X", "10.0000 XPR", 3, WEEK, false, 1]).send("alice@active"),
      "eosio_assert: Only XUSDC is supported"
    );
  });
  it("rejects too short period", async () => {
    await expectToThrow(
      circles.actions.create(["alice", "X", AMOUNT, 3, 3600, false, 1]).send("alice@active"),
      "eosio_assert: Period must be between 1 and 90 days"
    );
  });
});

describe("join (transfer join:<id>)", () => {
  it("joins with exact deposit", async () => {
    await join("bob");
    expect(members().map((m: any) => m.account)).to.deep.equal(["bob"]);
    expect(circle().members).to.equal(1);
    expect(balance("artcircles")).to.equal(AMOUNT);
  });
  it("rejects wrong amount", async () => {
    await expectToThrow(join("bob", "join:0", "5.000000 XUSDC"), "eosio_assert: Deposit must equal the required amount");
    expect(members()).to.have.length(0);
  });
  it("rejects unknown memo", async () => {
    await expectToThrow(join("bob", "hello"), "eosio_assert: Memo must be join:<id>, pay:<id> or topup:<id>");
  });
  it("rejects non-numeric id", async () => {
    await expectToThrow(join("bob", "join:abc"), "eosio_assert: Invalid circle id");
  });
  it("rejects missing circle", async () => {
    await expectToThrow(join("bob", "join:7"), "eosio_assert: Circle not found");
  });
  it("rejects double join", async () => {
    await join("bob");
    await expectToThrow(join("bob"), "eosio_assert: Already a member");
  });
  it("rejects when full", async () => {
    await circles.actions.create(["alice", "Small", AMOUNT, 2, WEEK, false, 1]).send("alice@active");
    await join("alice", "join:1");
    await join("bob", "join:1");
    await expectToThrow(join("carol", "join:1"), "eosio_assert: Circle is full");
  });
});

describe("leave", () => {
  it("refunds deposit before start", async () => {
    await join("bob");
    await circles.actions.leave(["bob", 0]).send("bob@active");
    expect(members()).to.have.length(0);
    expect(circle().members).to.equal(0);
    expect(balance("bob")).to.equal("1000.000000 XUSDC");
  });
  it("requires own auth", async () => {
    await join("bob");
    await expectToThrow(circles.actions.leave(["bob", 0]).send("alice@active"), "missing required authority bob");
  });
});

describe("cancel", () => {
  it("refunds everyone and marks cancelled", async () => {
    await join("alice");
    await join("bob");
    await circles.actions.cancel(["alice", 0]).send("alice@active");
    expect(circle().state).to.equal(3);
    expect(members()).to.have.length(0);
    expect(balance("alice")).to.equal("1000.000000 XUSDC");
    expect(balance("bob")).to.equal("1000.000000 XUSDC");
    expect(balance("artcircles")).to.equal("0.000000 XUSDC");
  });
  it("only organizer can cancel", async () => {
    await expectToThrow(circles.actions.cancel(["bob", 0]).send("bob@active"), "eosio_assert: Only the organizer can cancel");
  });
});

describe("order and start", () => {
  const fill = async () => { await join("alice"); await join("bob"); await join("carol"); };
  const setorder = (order: string[], by = "alice") =>
    circles.actions.setorder([by, 0, order]).send(`${by}@active`);
  const approve = (acc: string) => circles.actions.approve([acc, 0]).send(`${acc}@active`);
  const start = (by = "alice") => circles.actions.start([by, 0]).send(`${by}@active`);
  const slots = () => Object.fromEntries(members().map((m: any) => [m.account, m.slot]));

  it("sets order when full", async () => {
    await fill();
    await setorder(["carol", "alice", "bob"]);
    expect(slots()).to.deep.equal({ alice: 2, bob: 3, carol: 1 });
  });
  it("rejects order before circle is full", async () => {
    await join("alice"); await join("bob");
    await expectToThrow(setorder(["alice", "bob"]), "eosio_assert: Circle must be full before setting the order");
  });
  it("rejects order from non-organizer", async () => {
    await fill();
    await expectToThrow(setorder(["alice", "bob", "carol"], "bob"), "eosio_assert: Only the organizer can set the order");
  });
  it("rejects incomplete order", async () => {
    await fill();
    await expectToThrow(setorder(["alice", "bob"]), "eosio_assert: Order must list every member exactly once");
  });
  it("rejects duplicate in order", async () => {
    await fill();
    await expectToThrow(setorder(["alice", "bob", "alice"]), "eosio_assert: Duplicate in order: alice");
  });
  it("cannot start without all approvals", async () => {
    await fill();
    await setorder(["alice", "bob", "carol"]);
    await approve("alice"); await approve("bob");
    await expectToThrow(start(), "eosio_assert: Waiting for approval from carol");
  });
  it("changing order clears approvals", async () => {
    await fill();
    await setorder(["alice", "bob", "carol"]);
    await approve("alice"); await approve("bob"); await approve("carol");
    await setorder(["bob", "alice", "carol"]);
    expect(members().every((m: any) => !m.approved)).to.equal(true);
    await expectToThrow(start(), "eosio_assert: Waiting for approval from alice");
  });
  it("leaving clears order and approvals", async () => {
    await fill();
    await setorder(["alice", "bob", "carol"]);
    await approve("alice");
    await circles.actions.leave(["carol", 0]).send("carol@active");
    expect(members().every((m: any) => m.slot === 0 && !m.approved)).to.equal(true);
  });
  it("cannot approve before order is set", async () => {
    await fill();
    await expectToThrow(approve("bob"), "eosio_assert: Order has not been set yet");
  });
  it("starts when full, ordered and approved", async () => {
    await fill();
    await setorder(["carol", "alice", "bob"]);
    await approve("alice"); await approve("bob"); await approve("carol");
    await start();
    expect(circle().state).to.equal(1);
    expect(circle().round).to.equal(1);
  });
  it("no joining or leaving after start", async () => {
    await fill();
    await setorder(["alice", "bob", "carol"]);
    await approve("alice"); await approve("bob"); await approve("carol");
    await start();
    await expectToThrow(circles.actions.leave(["bob", 0]).send("bob@active"), "eosio_assert: Can only leave before the circle starts");
    await expectToThrow(circles.actions.cancel(["alice", 0]).send("alice@active"), "eosio_assert: Can only cancel before the circle starts");
  });
});

describe("pay and payout", () => {
  const pay = (acc: string, qty = AMOUNT, id = 0) =>
    xtokens.actions.transfer([acc, "artcircles", qty, `pay:${id}`]).send(`${acc}@active`);
  const payout = (by = "bob") => circles.actions.payout([0]).send(`${by}@active`);
  const startCircle = async () => {
    await join("alice"); await join("bob"); await join("carol");
    await circles.actions.setorder(["alice", 0, ["carol", "alice", "bob"]]).send("alice@active");
    for (const a of ["alice", "bob", "carol"]) await circles.actions.approve([a, 0]).send(`${a}@active`);
    await circles.actions.start(["alice", 0]).send("alice@active");
  };
  const payAll = async () => { await pay("alice"); await pay("bob"); await pay("carol"); };

  it("cannot pay before start", async () => {
    await join("alice");
    await expectToThrow(pay("alice"), "eosio_assert: Circle is not active");
  });
  it("rejects wrong amount", async () => {
    await startCircle();
    await expectToThrow(pay("alice", "5.000000 XUSDC"), "eosio_assert: Payment must equal the round amount");
  });
  it("rejects double payment in same round", async () => {
    await startCircle();
    await pay("alice");
    await expectToThrow(pay("alice"), "eosio_assert: Already paid for this round");
  });
  it("rejects payment from non-member", async () => {
    // circle 1 with two members, carol is not a member
    await circles.actions.create(["alice", "Pair", AMOUNT, 2, WEEK, false, 1]).send("alice@active");
    await join("alice", "join:1"); await join("bob", "join:1");
    await circles.actions.setorder(["alice", 1, ["alice", "bob"]]).send("alice@active");
    await circles.actions.approve(["alice", 1]).send("alice@active");
    await circles.actions.approve(["bob", 1]).send("bob@active");
    await circles.actions.start(["alice", 1]).send("alice@active");
    await expectToThrow(pay("carol", AMOUNT, 1), "eosio_assert: Not a member");
  });
  it("payout waits for everyone", async () => {
    await startCircle();
    await pay("alice"); await pay("bob");
    await expectToThrow(payout(), "eosio_assert: Waiting for payment from carol");
  });
  it("pays the pot to the member in the current slot", async () => {
    await startCircle();
    await payAll();
    await payout();
    // carol is first: 1000 - 10 deposit - 10 payment + 30 pot
    expect(balance("carol")).to.equal("1010.000000 XUSDC");
    expect(circle().round).to.equal(2);
    expect(members().find((m: any) => m.account === "carol").received).to.equal(true);
  });
  it("cannot pay out the same round twice", async () => {
    await startCircle();
    await payAll();
    await payout();
    await expectToThrow(payout(), "eosio_assert: Waiting for payment from alice");
  });
  it("full cycle: everyone receives once, deposits returned, circle completed", async () => {
    await startCircle();
    for (let r = 0; r < 3; r++) { await payAll(); await payout(); }
    expect(circle().state).to.equal(2);
    expect(balance("alice")).to.equal("1000.000000 XUSDC");
    expect(balance("bob")).to.equal("1000.000000 XUSDC");
    expect(balance("carol")).to.equal("1000.000000 XUSDC");
    expect(balance("artcircles")).to.equal("0.000000 XUSDC");
    expect(members().every((m: any) => m.received)).to.equal(true);
  });
  it("no payments after completion", async () => {
    await startCircle();
    for (let r = 0; r < 3; r++) { await payAll(); await payout(); }
    await expectToThrow(pay("alice"), "eosio_assert: Circle is not active");
  });
});

describe("deposits, late payments and defaults", () => {
  const pay = (acc: string, qty = AMOUNT, id = 0) =>
    xtokens.actions.transfer([acc, "artcircles", qty, `pay:${id}`]).send(`${acc}@active`);
  const payout = () => circles.actions.payout([0]).send("bob@active");
  // move time exactly to the current round deadline (round schedule is fixed)
  const afterDeadline = () => bc.setTime(TimePointSec.fromInteger(circle().roundStart + circle().periodSec));
  const member = (acc: string) => members().find((m: any) => m.account === acc);
  const rep = (acc: string) => circles.tables.reputation().getTableRows().find((r: any) => r.account === acc);
  const startCircle = async (order: string[]) => {
    await join("alice"); await join("bob"); await join("carol");
    await circles.actions.setorder(["alice", 0, order]).send("alice@active");
    for (const a of ["alice", "bob", "carol"]) await circles.actions.approve([a, 0]).send(`${a}@active`);
    await circles.actions.start(["alice", 0]).send("alice@active");
  };

  it("deposit must be 1 to 3 rounds", async () => {
    await expectToThrow(
      circles.actions.create(["alice", "X", AMOUNT, 3, WEEK, false, 0]).send("alice@active"),
      "eosio_assert: Deposit must be 1 to 3 rounds");
    await expectToThrow(
      circles.actions.create(["alice", "X", AMOUNT, 3, WEEK, false, 4]).send("alice@active"),
      "eosio_assert: Deposit must be 1 to 3 rounds");
  });
  it("two-round deposit requires double amount to join", async () => {
    await circles.actions.create(["alice", "Double", AMOUNT, 3, WEEK, false, 2]).send("alice@active");
    await expectToThrow(join("bob", "join:1"), "eosio_assert: Deposit must equal the required amount");
    await join("bob", "join:1", "20.000000 XUSDC");
    expect(members(1)[0].deposit).to.equal("20.000000 XUSDC");
  });
  it("before the deadline payout still waits", async () => {
    await startCircle(["carol", "alice", "bob"]);
    await pay("alice"); await pay("carol");
    await expectToThrow(payout(), "eosio_assert: Waiting for payment from bob");
  });
  it("after the deadline the deposit covers a missed payment", async () => {
    await startCircle(["carol", "alice", "bob"]);
    await pay("alice"); await pay("carol");
    afterDeadline();
    await payout();
    expect(balance("carol")).to.equal("1010.000000 XUSDC");
    expect(member("bob").deposit).to.equal("0.000000 XUSDC");
    expect(member("bob").missed).to.equal(1);
    expect(member("bob").defaulted).to.equal(false);
  });
  it("a used deposit can be topped up", async () => {
    await startCircle(["carol", "alice", "bob"]);
    await pay("alice"); await pay("carol");
    afterDeadline();
    await payout();
    await expectToThrow(
      xtokens.actions.transfer(["bob", "artcircles", "5.000000 XUSDC", "topup:0"]).send("bob@active"),
      "eosio_assert: Top-up must equal the missing deposit");
    await xtokens.actions.transfer(["bob", "artcircles", AMOUNT, "topup:0"]).send("bob@active");
    expect(member("bob").deposit).to.equal(AMOUNT);
  });
  it("top-up rejected when deposit is full", async () => {
    await startCircle(["carol", "alice", "bob"]);
    await expectToThrow(
      xtokens.actions.transfer(["bob", "artcircles", AMOUNT, "topup:0"]).send("bob@active"),
      "eosio_assert: Deposit is already full");
  });
  it("recipient who did not pay gets the pot minus own share", async () => {
    await startCircle(["carol", "alice", "bob"]);
    await pay("alice"); await pay("bob");
    afterDeadline();
    await payout();
    // carol: 1000 - 10 deposit + 20 pot, deposit stays untouched
    expect(balance("carol")).to.equal("1010.000000 XUSDC");
    expect(member("carol").deposit).to.equal(AMOUNT);
    expect(member("carol").missed).to.equal(1);
  });
  it("default after receiving: circle continues, loss falls on those still waiting", async () => {
    await startCircle(["carol", "alice", "bob"]);
    // round 1: everyone pays, carol receives 30
    await pay("alice"); await pay("bob"); await pay("carol"); await payout();
    // round 2: carol doesn't pay, covered by deposit
    await pay("alice"); await pay("bob"); afterDeadline(); await payout();
    // round 3: carol doesn't pay, no deposit left, bob gets a smaller pot
    await pay("alice"); await pay("bob"); afterDeadline(); await payout();

    expect(circle().state).to.equal(2);
    expect(balance("alice")).to.equal("1000.000000 XUSDC");
    expect(balance("bob")).to.equal("990.000000 XUSDC");
    expect(balance("carol")).to.equal("1010.000000 XUSDC");
    expect(balance("artcircles")).to.equal("0.000000 XUSDC");
    expect(rep("carol").defaulted).to.equal(1);
    expect(rep("alice").completed).to.equal(1);
    expect(rep("bob").completed).to.equal(1);
  });
  it("default before receiving: debt is withheld from the pot and returned to those who lost", async () => {
    await startCircle(["alice", "bob", "carol"]);
    // round 1: carol doesn't pay, covered by deposit, alice receives 30
    await pay("alice"); await pay("bob"); afterDeadline(); await payout();
    // round 2: carol doesn't pay, no deposit left: debt 10, bob gets 20
    await pay("alice"); await pay("bob"); afterDeadline(); await payout();
    expect(member("carol").debt).to.equal(10000000);
    // round 3: carol's turn, she gets the pot minus her own share and her debt
    await pay("alice"); await pay("bob"); afterDeadline(); await payout();

    expect(circle().state).to.equal(2);
    // nobody profited from not paying, nobody lost anything
    expect(balance("alice")).to.equal("1000.000000 XUSDC");
    expect(balance("bob")).to.equal("1000.000000 XUSDC");
    expect(balance("carol")).to.equal("1000.000000 XUSDC");
    expect(balance("artcircles")).to.equal("0.000000 XUSDC");
    expect(rep("carol").defaulted).to.equal(1);
  });
});

describe("deposit refill on payout and payout records", () => {
  const ALL = ["alice", "bob", "carol", "dave", "erin"];
  const pay = (acc: string) =>
    xtokens.actions.transfer([acc, "artcircles", AMOUNT, "pay:1"]).send(`${acc}@active`);
  const payout = () => circles.actions.payout([1]).send("bob@active");
  const afterDeadline = () => bc.setTime(TimePointSec.fromInteger(circle(1).roundStart + circle(1).periodSec));
  const member = (acc: string) => members(1).find((m: any) => m.account === acc);
  const payouts = () => circles.tables.payouts(BigInt(1)).getTableRows();
  const round = async (payers: string[]) => {
    for (const a of payers) await pay(a);
    if (payers.length < ALL.length) afterDeadline();
    await payout();
  };
  const startCircle = async () => {
    await circles.actions.create(["alice", "Five", AMOUNT, 5, WEEK, false, 1]).send("alice@active");
    for (const a of ALL) await join(a, "join:1");
    await circles.actions.setorder(["alice", 1, ALL]).send("alice@active");
    for (const a of ALL) await circles.actions.approve([a, 1]).send(`${a}@active`);
    await circles.actions.start(["alice", 1]).send("alice@active");
  };

  it("recipient with a used deposit refills it from the pot", async () => {
    await startCircle();
    await round(ALL);
    await round(["alice", "bob", "dave", "erin"]); // carol misses, deposit covers
    expect(member("carol").deposit).to.equal("0.000000 XUSDC");
    await round(ALL); // carol's turn: 50 pot, 10 back into her deposit
    expect(member("carol").deposit).to.equal(AMOUNT);
    // carol: 1000 - 10 deposit - 20 paid + 40 received, refilled deposit still held
    expect(balance("carol")).to.equal("1010.000000 XUSDC");
    const p = payouts().find((r: any) => r.round === 3);
    expect(p.paid).to.equal("40.000000 XUSDC");
    expect(p.toDeposit).to.equal(AMOUNT);
  });

  it("public testnet circle 4 scenario: nobody gains or loses", async () => {
    await startCircle();
    await round(ALL);                                   // 1: alice
    await round(["alice", "bob", "dave", "erin"]);       // 2: bob, carol missed
    await round(ALL);                                   // 3: carol, deposit refilled
    await round(["alice", "bob", "carol", "dave"]);      // 4: dave, erin missed
    await round([]);                                    // 5: erin, nobody paid

    expect(circle(1).state).to.equal(2);
    for (const a of ALL) expect(balance(a)).to.equal("1000.000000 XUSDC");
    expect(balance("artcircles")).to.equal("0.000000 XUSDC");

    const last = payouts().find((r: any) => r.round === 5);
    expect(last.recipient).to.equal("erin");
    expect(last.paid).to.equal("40.000000 XUSDC");
    expect(last.recipientMissed).to.equal(true);
    expect(last.covered).to.deep.equal(["alice", "bob", "carol", "dave"]);
    expect(last.unpaid).to.deep.equal([]);
  });

  it("records one payout row per round", async () => {
    await startCircle();
    await round(ALL);
    await round(["alice", "bob", "dave", "erin"]);
    const rows = payouts();
    expect(rows.map((r: any) => r.round)).to.deep.equal([1, 2]);
    expect(rows[0].recipient).to.equal("alice");
    expect(rows[0].paid).to.equal("50.000000 XUSDC");
    expect(rows[0].covered).to.deep.equal([]);
    expect(rows[1].covered).to.deep.equal(["carol"]);
    expect(rows[1].withheld).to.equal("0.000000 XUSDC");
  });
});

describe("KYC circles", () => {
  const setUser = (acc: string, withKyc: boolean) =>
    proton.actions.setuser([acc, withKyc]).send("eosio.proton@active");
  beforeEach(async () => {
    await circles.actions.create(["alice", "KYC", AMOUNT, 3, WEEK, true, 1]).send("alice@active");
  });

  it("member with KYC can join", async () => {
    await setUser("bob", true);
    await join("bob", "join:1");
    expect(members(1).map((m: any) => m.account)).to.deep.equal(["bob"]);
  });
  it("member without KYC is rejected", async () => {
    await setUser("carol", false);
    await expectToThrow(join("carol", "join:1"), "eosio_assert: This circle requires KYC verified members");
  });
  it("account with no profile is rejected", async () => {
    await expectToThrow(join("alice", "join:1"), "eosio_assert: This circle requires KYC verified members");
  });
  it("non-KYC circles accept anyone", async () => {
    await join("carol", "join:0");
    expect(members(0)).to.have.length(1);
  });
});

describe("memberships index", () => {
  const index = (acc: string) =>
    circles.tables.memberships(nameToBigInt(Name.from(acc))).getTableRows();

  it("create records the organizer", () => {
    expect(index("alice")).to.deep.equal([{ circle: 0, organizer: true, member: false }]);
  });
  it("join records the member", async () => {
    await join("bob");
    expect(index("bob")).to.deep.equal([{ circle: 0, organizer: false, member: true }]);
  });
  it("organizer joining their own circle has both flags in one row", async () => {
    await join("alice");
    expect(index("alice")).to.deep.equal([{ circle: 0, organizer: true, member: true }]);
  });
  it("leave removes the member row", async () => {
    await join("bob");
    await circles.actions.leave(["bob", 0]).send("bob@active");
    expect(index("bob")).to.have.length(0);
  });
  it("organizer leaving keeps the organizer row", async () => {
    await join("alice");
    await circles.actions.leave(["alice", 0]).send("alice@active");
    expect(index("alice")).to.deep.equal([{ circle: 0, organizer: true, member: false }]);
  });
  it("cancel removes member rows and keeps the organizer row", async () => {
    await join("alice");
    await join("bob");
    await circles.actions.cancel(["alice", 0]).send("alice@active");
    expect(index("bob")).to.have.length(0);
    expect(index("alice")).to.deep.equal([{ circle: 0, organizer: true, member: false }]);
  });
  it("lists every circle of an account", async () => {
    await circles.actions.create(["bob", "Work", AMOUNT, 2, WEEK, false, 1]).send("bob@active");
    await join("alice", "join:1");
    expect(index("alice")).to.deep.equal([
      { circle: 0, organizer: true, member: false },
      { circle: 1, organizer: false, member: true },
    ]);
  });
  it("rows stay after a circle completes", async () => {
    await join("alice");
    await join("bob");
    await join("carol");
    await circles.actions.setorder(["alice", 0, ["alice", "bob", "carol"]]).send("alice@active");
    for (const acc of ["alice", "bob", "carol"]) {
      await circles.actions.approve([acc, 0]).send(`${acc}@active`);
    }
    await circles.actions.start(["alice", 0]).send("alice@active");
    for (let round = 0; round < 3; round++) {
      for (const acc of ["alice", "bob", "carol"]) {
        await xtokens.actions.transfer([acc, "artcircles", AMOUNT, "pay:0"]).send(`${acc}@active`);
      }
      await circles.actions.payout([0]).send("bob@active");
    }
    expect(circle().state).to.equal(2);
    expect(index("carol")).to.deep.equal([{ circle: 0, organizer: false, member: true }]);
  });
  it("reindex requires the contract's own authority", async () => {
    await expectToThrow(circles.actions.reindex([0]).send("alice@active"), "missing required authority artcircles");
  });
  it("reindex is idempotent and keeps existing flags", async () => {
    await join("alice");
    await join("bob");
    await circles.actions.reindex([0]).send("artcircles@active");
    await circles.actions.reindex([0]).send("artcircles@active");
    expect(index("alice")).to.deep.equal([{ circle: 0, organizer: true, member: true }]);
    expect(index("bob")).to.deep.equal([{ circle: 0, organizer: false, member: true }]);
  });
});
