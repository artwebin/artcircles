import {
    Name, Asset, Symbol, Table, TableStore, Singleton, Contract,
    check, requireAuth, unpackActionData, currentTimeSec,
    EMPTY_NAME, SAME_PAYER
} from "proton-tsc";
import { Transfer, sendTransferToken } from "proton-tsc/token";
import { UserInfo } from "./proton.tables";

const PROTON_USERS = Name.fromString("eosio.proton");

// Supported tokens. A circle uses the token of its round amount; every transfer
// in or out of a circle goes through that token's own contract.
const XUSDC_SYMBOL = new Symbol("XUSDC", 6);
const XUSDC_CONTRACT = Name.fromString("xtokens");
const XMD_SYMBOL = new Symbol("XMD", 6);
const XMD_CONTRACT = Name.fromString("xmd.token");

function tokenContractOf(sym: Symbol): Name {
    if (sym == XUSDC_SYMBOL) return XUSDC_CONTRACT;
    if (sym == XMD_SYMBOL) return XMD_CONTRACT;
    check(false, "Only XUSDC and XMD are supported");
    return EMPTY_NAME;
}

const STATE_FORMING: u8 = 0;
const STATE_ACTIVE: u8 = 1;
const STATE_COMPLETED: u8 = 2;
const STATE_CANCELLED: u8 = 3;

const MIN_MEMBERS: u32 = 2;
const MAX_MEMBERS: u32 = 50;
const MIN_PERIOD: u32 = 86400;        // 1 day
const MAX_PERIOD: u32 = 86400 * 90;   // 90 days
const MAX_AMOUNT: i64 = 100000 * 1000000; // 100,000 per round (all supported tokens have 6 decimals)

@table("global", singleton)
export class Global extends Table {
    constructor(public nextId: u64 = 0) { super(); }
}

@table("circles")
export class Circle extends Table {
    constructor(
        public id: u64 = 0,
        public organizer: Name = EMPTY_NAME,
        public name: string = "",
        public amount: Asset = new Asset(),
        public maxMembers: u32 = 0,
        public members: u32 = 0,
        public periodSec: u32 = 0,
        public requireKyc: bool = false,
        public state: u8 = 0,
        public round: u32 = 0,
        public roundStart: u32 = 0,
        public created: u32 = 0,
        public depositRounds: u8 = 1,
        public reserve: i64 = 0
    ) { super(); }

    @primary
    get primary(): u64 { return this.id; }
}

// scope = circle id
@table("members")
export class Member extends Table {
    constructor(
        public account: Name = EMPTY_NAME,
        public slot: u32 = 0,
        public deposit: Asset = new Asset(),
        public paidRound: u32 = 0,
        public received: bool = false,
        public missed: u32 = 0,
        public joined: u32 = 0,
        public approved: bool = false,
        public debt: i64 = 0,
        public shortBy: i64 = 0,
        public defaulted: bool = false
    ) { super(); }

    @primary
    get primary(): u64 { return this.account.N; }
}

// Saver reputation across all circles
@table("reputation")
export class Reputation extends Table {
    constructor(
        public account: Name = EMPTY_NAME,
        public completed: u32 = 0,
        public missed: u32 = 0,
        public defaulted: u32 = 0
    ) { super(); }

    @primary
    get primary(): u64 { return this.account.N; }
}

// One row per paid-out round, so the actual outcome can be read without a history node.
// scope = circle id
@table("payouts")
export class Payout extends Table {
    constructor(
        public round: u32 = 0,
        public recipient: Name = EMPTY_NAME,
        public paid: Asset = new Asset(),
        public withheld: Asset = new Asset(),
        public toDeposit: Asset = new Asset(),
        public covered: Name[] = [],
        public unpaid: Name[] = [],
        public recipientMissed: bool = false,
        public time: u32 = 0
    ) { super(); }

    @primary
    get primary(): u64 { return <u64>this.round; }
}

// Index of circles per account, so an account's circles can be read without scanning every circle.
// scope = account, one row per circle the account organizes or is a member of
@table("memberships")
export class Membership extends Table {
    constructor(
        public circle: u64 = 0,
        public organizer: bool = false,
        public member: bool = false
    ) { super(); }

    @primary
    get primary(): u64 { return this.circle; }
}

function parseId(s: string): u64 {
    check(s.length > 0 && s.length <= 19, "Invalid circle id");
    let v: u64 = 0;
    for (let i = 0; i < s.length; i++) {
        const c = s.charCodeAt(i);
        check(c >= 48 && c <= 57, "Invalid circle id");
        v = v * 10 + <u64>(c - 48);
    }
    return v;
}

@contract
export class artcircles extends Contract {
    contract: Name = this.receiver;
    circles: TableStore<Circle> = new TableStore<Circle>(this.receiver);
    global: Singleton<Global> = new Singleton<Global>(this.receiver);
    reputation: TableStore<Reputation> = new TableStore<Reputation>(this.receiver);

    membersOf(id: u64): TableStore<Member> {
        return new TableStore<Member>(this.receiver, Name.fromU64(id));
    }

    payoutsOf(id: u64): TableStore<Payout> {
        return new TableStore<Payout>(this.receiver, Name.fromU64(id));
    }

    membershipsOf(account: Name): TableStore<Membership> {
        return new TableStore<Membership>(this.receiver, account);
    }

    // Records that an account organizes and/or is a member of a circle. RAM is paid by the contract.
    markMembership(account: Name, id: u64, asOrganizer: bool, asMember: bool): void {
        const index = this.membershipsOf(account);
        const row = index.get(id);
        if (row == null) {
            index.store(new Membership(id, asOrganizer, asMember), this.contract);
            return;
        }
        let changed = false;
        if (asOrganizer && !row!.organizer) { row!.organizer = true; changed = true; }
        if (asMember && !row!.member) { row!.member = true; changed = true; }
        if (changed) index.update(row!, SAME_PAYER);
    }

    // Removes the member flag; the row is erased unless the account also organizes the circle.
    unmarkMember(account: Name, id: u64): void {
        const index = this.membershipsOf(account);
        const row = index.get(id);
        if (row == null) return;
        if (row!.organizer) {
            if (row!.member) {
                row!.member = false;
                index.update(row!, SAME_PAYER);
            }
        } else {
            index.remove(row!);
        }
    }

    @action("create")
    create(
        organizer: Name,
        name: string,
        amount: Asset,
        maxMembers: u32,
        periodSec: u32,
        requireKyc: bool,
        depositRounds: u8
    ): void {
        requireAuth(organizer);
        check(name.length > 0 && name.length <= 64, "Name must be 1-64 characters");
        tokenContractOf(amount.symbol);
        check(amount.isValid() && amount.amount > 0, "Amount must be positive");
        check(amount.amount <= MAX_AMOUNT, "Amount too large");
        check(depositRounds >= 1 && depositRounds <= 3, "Deposit must be 1 to 3 rounds");
        check(maxMembers >= MIN_MEMBERS && maxMembers <= MAX_MEMBERS, "Members must be between 2 and 50");
        check(periodSec >= MIN_PERIOD && periodSec <= MAX_PERIOD, "Period must be between 1 and 90 days");

        const g = this.global.get();
        const id = g.nextId;
        g.nextId = id + 1;
        this.global.set(g, this.contract);

        const circle = new Circle(
            id, organizer, name, amount, maxMembers, 0,
            periodSec, requireKyc, STATE_FORMING, 0, 0, currentTimeSec(),
            depositRounds, 0
        );
        this.circles.store(circle, organizer);
        this.markMembership(organizer, id, true, false);
    }

    // Joining a circle = a single deposit transfer with memo "join:<id>"
    @action("transfer", notify)
    transfer(): void {
        const t = unpackActionData<Transfer>();

        // Ignore outgoing transfers and transfers not addressed to this contract
        if (t.from == this.contract || t.to != this.contract) return;

        // A token is accepted only from its own contract, so a look-alike token
        // with the same symbol issued elsewhere is rejected.
        check(this.firstReceiver == tokenContractOf(t.quantity.symbol), "Token not accepted from this contract");

        const parts = t.memo.split(":");
        check(parts.length == 2, "Memo must be join:<id>, pay:<id> or topup:<id>");

        if (parts[0] == "join") {
            this.join(t.from, parseId(parts[1]), t.quantity);
            return;
        }
        if (parts[0] == "pay") {
            this.pay(t.from, parseId(parts[1]), t.quantity);
            return;
        }
        if (parts[0] == "topup") {
            this.topup(t.from, parseId(parts[1]), t.quantity);
            return;
        }
        check(false, "Unknown memo action");
    }

    join(account: Name, id: u64, quantity: Asset): void {
        const circle = this.circles.requireGet(id, "Circle not found");
        check(circle.state == STATE_FORMING, "Circle is not accepting members");
        check(circle.members < circle.maxMembers, "Circle is full");
        this.checkToken(circle, quantity);
        check(quantity == this.depositOf(circle), "Deposit must equal the required amount");
        if (circle.requireKyc) {
            check(this.hasKyc(account), "This circle requires KYC verified members");
        }

        const members = this.membersOf(id);
        check(!members.exists(account.N), "Already a member");

        members.store(new Member(account, 0, quantity, 0, false, 0, currentTimeSec(), false, 0, 0, false), this.contract);
        circle.members += 1;
        this.circles.update(circle, SAME_PAYER);
        this.markMembership(account, id, false, true);
    }

    // Paying the current round = a transfer with memo "pay:<id>"
    pay(account: Name, id: u64, quantity: Asset): void {
        const circle = this.circles.requireGet(id, "Circle not found");
        check(circle.state == STATE_ACTIVE, "Circle is not active");
        this.checkToken(circle, quantity);
        check(quantity == circle.amount, "Payment must equal the round amount");

        const members = this.membersOf(id);
        const m = members.requireGet(account.N, "Not a member");
        check(m.paidRound != circle.round, "Already paid for this round");

        m.paidRound = circle.round;
        members.update(m, SAME_PAYER);
    }

    // KYC = at least one KYC provider entry in eosio.proton::usersinfo
    hasKyc(account: Name): bool {
        const users = new TableStore<UserInfo>(PROTON_USERS, PROTON_USERS);
        const u = users.get(account.N);
        return u != null && u!.kyc.length > 0;
    }

    checkToken(circle: Circle, quantity: Asset): void {
        check(quantity.symbol == circle.amount.symbol, `This circle uses ${circle.amount.symbol.getSymbolString()}`);
    }

    depositOf(circle: Circle): Asset {
        return new Asset(circle.amount.amount * <i64>circle.depositRounds, circle.amount.symbol);
    }

    // Refilling a used deposit = a transfer with memo "topup:<id>"
    topup(account: Name, id: u64, quantity: Asset): void {
        const circle = this.circles.requireGet(id, "Circle not found");
        check(circle.state == STATE_ACTIVE, "Circle is not active");
        this.checkToken(circle, quantity);

        const members = this.membersOf(id);
        const m = members.requireGet(account.N, "Not a member");
        check(!m.defaulted, "Defaulted members cannot top up");
        const missing = this.depositOf(circle).amount - m.deposit.amount;
        check(missing > 0, "Deposit is already full");
        check(quantity.amount == missing, "Top-up must equal the missing deposit");

        m.deposit = this.depositOf(circle);
        members.update(m, SAME_PAYER);
    }

    // Pays out the pot. Anyone can trigger it, the contract depends on no one.
    // Before the deadline: wait for everyone. After the deadline: unpaid shares
    // are covered from the deposit; without a deposit the member takes on debt
    // and the pot is smaller. A recipient whose deposit was used refills it from
    // their own pot, so nobody receives the pot with an empty deposit.
    @action("payout")
    payout(id: u64): void {
        const circle = this.circles.requireGet(id, "Circle not found");
        check(circle.state == STATE_ACTIVE, "Circle is not active");

        const deadlinePassed = currentTimeSec() >= circle.roundStart + circle.periodSec;
        const amount = circle.amount.amount;
        const members = this.membersOf(id);

        // 1. Find the recipient and check whether we can pay out
        let recipient: Member | null = null;
        let m = members.first();
        while (m) {
            if (m.slot == circle.round) recipient = m;
            if (m.paidRound != circle.round) {
                check(deadlinePassed, `Waiting for payment from ${m.account}`);
            }
            m = members.next(m);
        }
        check(recipient != null, "No recipient for this round");
        check(!recipient!.received, "Recipient already received");
        const recipientN = recipient!.account.N;

        // 2. Collect what is actually available this round
        let collected: i64 = 0;
        let shortFromOthers: i64 = 0;
        let recipientMissed = false;
        const covered: Name[] = [];
        const unpaid: Name[] = [];
        m = members.first();
        while (m) {
            const isRecipient = m.account.N == recipientN;
            if (m.paidRound == circle.round) {
                collected += amount;
            } else if (isRecipient) {
                // Recipient did not pay: their own share is simply netted from the pot
                recipientMissed = true;
                m.missed += 1;
                m.paidRound = circle.round;
                members.update(m, SAME_PAYER);
            } else if (m.deposit.amount >= amount) {
                // Covered by deposit
                m.deposit = new Asset(m.deposit.amount - amount, m.deposit.symbol);
                m.missed += 1;
                m.paidRound = circle.round;
                members.update(m, SAME_PAYER);
                collected += amount;
                covered.push(m.account);
            } else {
                // No deposit left: record debt, the pot is smaller
                m.missed += 1;
                m.debt += amount;
                m.defaulted = true;
                m.paidRound = circle.round;
                members.update(m, SAME_PAYER);
                shortFromOthers += amount;
                unpaid.push(m.account);
            }
            m = members.next(m);
        }

        // 3. Pay the recipient, minus any outstanding debt of their own
        const r = members.requireGet(recipientN, "Recipient missing");
        let payoutAmount = collected;
        let withheld: i64 = 0;
        if (r.debt > 0) {
            withheld = r.debt < payoutAmount ? r.debt : payoutAmount;
            payoutAmount -= withheld;
            r.debt -= withheld;
            circle.reserve += withheld;
        }
        // Refill the recipient's deposit before paying them, so a member who used
        // their deposit cannot take the full pot and leave the rest uncovered.
        // Not needed in the last round, there is nothing left to cover.
        const sym = circle.amount.symbol;
        const missingDeposit = this.depositOf(circle).amount - r.deposit.amount;
        let toDeposit: i64 = 0;
        if (missingDeposit > 0 && circle.round < circle.members) {
            toDeposit = missingDeposit < payoutAmount ? missingDeposit : payoutAmount;
            payoutAmount -= toDeposit;
            r.deposit = new Asset(r.deposit.amount + toDeposit, sym);
        }
        r.received = true;
        r.shortBy += shortFromOthers;
        members.update(r, SAME_PAYER);

        if (payoutAmount > 0) {
            sendTransferToken(tokenContractOf(circle.amount.symbol), this.contract, r.account,
                new Asset(payoutAmount, circle.amount.symbol),
                `artcircles: circle ${id}, round ${circle.round} payout`);
        }

        this.payoutsOf(id).store(new Payout(
            circle.round, r.account,
            new Asset(payoutAmount, sym), new Asset(withheld, sym), new Asset(toDeposit, sym),
            covered, unpaid, recipientMissed, currentTimeSec()
        ), this.contract);

        if (circle.round == circle.members) {
            this.finish(circle);
        } else {
            circle.round += 1;
            circle.roundStart += circle.periodSec;
        }
        this.circles.update(circle, SAME_PAYER);
    }

    // Completion: reserve goes to members who received a short pot, deposits are refunded, reputation is recorded
    finish(circle: Circle): void {
        const id = circle.id;
        const amount = circle.amount.amount;
        const sym = circle.amount.symbol;
        const members = this.membersOf(id);

        // All values are multiples of the round amount, so we compute in round units (no overflow)
        let totalShortUnits: i64 = 0;
        let m = members.first();
        while (m) { totalShortUnits += m.shortBy / amount; m = members.next(m); }

        const reserveUnits = circle.reserve / amount;
        let distributed: i64 = 0;
        let largest: Member | null = null;

        m = members.first();
        while (m) {
            let refund = m.deposit.amount;
            if (reserveUnits > 0 && totalShortUnits > 0 && m.shortBy > 0) {
                const share = (reserveUnits * (m.shortBy / amount) * amount) / totalShortUnits;
                refund += share;
                distributed += share;
                if (largest == null || m.shortBy > largest!.shortBy) largest = m;
            }
            if (refund > 0) {
                sendTransferToken(tokenContractOf(circle.amount.symbol), this.contract, m.account, new Asset(refund, sym),
                    `artcircles: circle ${id} completed, deposit refund and compensation`);
            }
            this.bumpReputation(m);
            m = members.next(m);
        }

        // Rounding remainder goes to the member who lost the most
        const dust = circle.reserve - distributed;
        if (dust > 0 && largest != null) {
            sendTransferToken(tokenContractOf(circle.amount.symbol), this.contract, largest!.account, new Asset(dust, sym),
                `artcircles: circle ${id} completed, rounding remainder`);
        }

        circle.reserve = 0;
        circle.state = STATE_COMPLETED;
    }

    bumpReputation(m: Member): void {
        let rep = this.reputation.get(m.account.N);
        if (rep == null) rep = new Reputation(m.account, 0, 0, 0);
        if (m.defaulted) rep!.defaulted += 1;
        else rep!.completed += 1;
        rep!.missed += m.missed;
        this.reputation.set(rep!, this.contract);
    }

    @action("leave")
    leave(account: Name, id: u64): void {
        requireAuth(account);
        const circle = this.circles.requireGet(id, "Circle not found");
        check(circle.state == STATE_FORMING, "Can only leave before the circle starts");

        const members = this.membersOf(id);
        const m = members.requireGet(account.N, "Not a member");
        const refund = m.deposit;
        members.remove(m);
        circle.members -= 1;
        this.circles.update(circle, SAME_PAYER);
        this.unmarkMember(account, id);

        // Membership changed, the agreed order is no longer valid
        this.clearOrder(id);

        sendTransferToken(tokenContractOf(circle.amount.symbol), this.contract, account, refund, `artcircles: deposit refund, circle ${id}`);
    }

    clearOrder(id: u64): void {
        const members = this.membersOf(id);
        let m = members.first();
        while (m) {
            if (m.slot != 0 || m.approved) {
                m.slot = 0;
                m.approved = false;
                members.update(m, SAME_PAYER);
            }
            m = members.next(m);
        }
    }

    @action("setorder")
    setorder(organizer: Name, id: u64, order: Name[]): void {
        requireAuth(organizer);
        const circle = this.circles.requireGet(id, "Circle not found");
        check(circle.organizer == organizer, "Only the organizer can set the order");
        check(circle.state == STATE_FORMING, "Order can only be set before the circle starts");
        check(circle.members == circle.maxMembers, "Circle must be full before setting the order");
        check(<u32>order.length == circle.members, "Order must list every member exactly once");

        // Any change to the order clears all approvals
        this.clearOrder(id);

        const members = this.membersOf(id);
        for (let i = 0; i < order.length; i++) {
            const m = members.requireGet(order[i].N, `Not a member: ${order[i]}`);
            check(m.slot == 0, `Duplicate in order: ${order[i]}`);
            m.slot = <u32>(i + 1);
            members.update(m, SAME_PAYER);
        }
    }

    @action("approve")
    approve(account: Name, id: u64): void {
        requireAuth(account);
        const circle = this.circles.requireGet(id, "Circle not found");
        check(circle.state == STATE_FORMING, "Circle has already started");

        const members = this.membersOf(id);
        const m = members.requireGet(account.N, "Not a member");
        check(m.slot != 0, "Order has not been set yet");
        check(!m.approved, "Already approved");
        m.approved = true;
        members.update(m, SAME_PAYER);
    }

    @action("start")
    start(organizer: Name, id: u64): void {
        requireAuth(organizer);
        const circle = this.circles.requireGet(id, "Circle not found");
        check(circle.organizer == organizer, "Only the organizer can start");
        check(circle.state == STATE_FORMING, "Circle is not in forming state");
        check(circle.members == circle.maxMembers, "Circle is not full");

        const members = this.membersOf(id);
        let m = members.first();
        while (m) {
            check(m.slot != 0, "Order has not been set");
            check(m.approved, `Waiting for approval from ${m.account}`);
            m = members.next(m);
        }

        circle.state = STATE_ACTIVE;
        circle.round = 1;
        circle.roundStart = currentTimeSec();
        this.circles.update(circle, SAME_PAYER);
    }

    @action("cancel")
    cancel(organizer: Name, id: u64): void {
        requireAuth(organizer);
        const circle = this.circles.requireGet(id, "Circle not found");
        check(circle.organizer == organizer, "Only the organizer can cancel");
        check(circle.state == STATE_FORMING, "Can only cancel before the circle starts");

        const members = this.membersOf(id);
        let m = members.first();
        while (m) {
            const next = members.next(m);
            sendTransferToken(tokenContractOf(circle.amount.symbol), this.contract, m.account, m.deposit, `artcircles: circle ${id} cancelled, deposit refund`);
            this.unmarkMember(m.account, id);
            members.remove(m);
            m = next;
        }

        circle.members = 0;
        circle.state = STATE_CANCELLED;
        this.circles.update(circle, SAME_PAYER);
    }

    // Rebuilds the memberships index for one circle. Only for circles created before the index existed.
    @action("reindex")
    reindex(id: u64): void {
        requireAuth(this.contract);
        const circle = this.circles.requireGet(id, "Circle not found");
        this.markMembership(circle.organizer, id, true, false);
        const members = this.membersOf(id);
        let m = members.first();
        while (m) {
            this.markMembership(m.account, id, false, true);
            m = members.next(m);
        }
    }
}
