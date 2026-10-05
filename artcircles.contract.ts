import {
    Name, Asset, Symbol, Table, TableStore, Singleton, Contract,
    check, requireAuth, unpackActionData, currentTimeSec,
    EMPTY_NAME, SAME_PAYER
} from "proton-tsc";
import { Transfer, sendTransferToken } from "proton-tsc/token";
import { UserInfo } from "./proton.tables";

const PROTON_USERS = Name.fromString("eosio.proton");

// v1: XUSDC on xtokens only
const TOKEN_CONTRACT = Name.fromString("xtokens");
const TOKEN_SYMBOL = new Symbol("XUSDC", 6);

const STATE_FORMING: u8 = 0;
const STATE_ACTIVE: u8 = 1;
const STATE_COMPLETED: u8 = 2;
const STATE_CANCELLED: u8 = 3;

const MIN_MEMBERS: u32 = 2;
const MAX_MEMBERS: u32 = 50;
const MIN_PERIOD: u32 = 86400;        // 1 day
const MAX_PERIOD: u32 = 86400 * 90;   // 90 days
const MAX_AMOUNT: i64 = 100000 * 1000000; // 100,000 XUSDC per round

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
        check(amount.symbol == TOKEN_SYMBOL, "Only XUSDC is supported");
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
    }

    // Joining a circle = a single deposit transfer with memo "join:<id>"
    @action("transfer", notify)
    transfer(): void {
        const t = unpackActionData<Transfer>();

        // Ignore outgoing transfers and transfers not addressed to this contract
        if (t.from == this.contract || t.to != this.contract) return;

        check(this.firstReceiver == TOKEN_CONTRACT, "Only xtokens transfers are accepted");
        check(t.quantity.symbol == TOKEN_SYMBOL, "Only XUSDC is accepted");

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
        check(quantity == this.depositOf(circle), "Deposit must equal the required amount");
        if (circle.requireKyc) {
            check(this.hasKyc(account), "This circle requires KYC verified members");
        }

        const members = this.membersOf(id);
        check(!members.exists(account.N), "Already a member");

        members.store(new Member(account, 0, quantity, 0, false, 0, currentTimeSec(), false, 0, 0, false), this.contract);
        circle.members += 1;
        this.circles.update(circle, SAME_PAYER);
    }

    // Paying the current round = a transfer with memo "pay:<id>"
    pay(account: Name, id: u64, quantity: Asset): void {
        const circle = this.circles.requireGet(id, "Circle not found");
        check(circle.state == STATE_ACTIVE, "Circle is not active");
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

    depositOf(circle: Circle): Asset {
        return new Asset(circle.amount.amount * <i64>circle.depositRounds, circle.amount.symbol);
    }

    // Refilling a used deposit = a transfer with memo "topup:<id>"
    topup(account: Name, id: u64, quantity: Asset): void {
        const circle = this.circles.requireGet(id, "Circle not found");
        check(circle.state == STATE_ACTIVE, "Circle is not active");

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
    // and the pot is smaller.
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
        m = members.first();
        while (m) {
            const isRecipient = m.account.N == recipientN;
            if (m.paidRound == circle.round) {
                collected += amount;
            } else if (isRecipient) {
                // Recipient did not pay: their own share is simply netted from the pot
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
            } else {
                // No deposit left: record debt, the pot is smaller
                m.missed += 1;
                m.debt += amount;
                m.defaulted = true;
                m.paidRound = circle.round;
                members.update(m, SAME_PAYER);
                shortFromOthers += amount;
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
        r.received = true;
        r.shortBy += shortFromOthers;
        members.update(r, SAME_PAYER);

        if (payoutAmount > 0) {
            sendTransferToken(TOKEN_CONTRACT, this.contract, r.account,
                new Asset(payoutAmount, circle.amount.symbol),
                `artcircles: circle ${id}, round ${circle.round} payout`);
        }

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
                sendTransferToken(TOKEN_CONTRACT, this.contract, m.account, new Asset(refund, sym),
                    `artcircles: circle ${id} completed, deposit refund and compensation`);
            }
            this.bumpReputation(m);
            m = members.next(m);
        }

        // Rounding remainder goes to the member who lost the most
        const dust = circle.reserve - distributed;
        if (dust > 0 && largest != null) {
            sendTransferToken(TOKEN_CONTRACT, this.contract, largest!.account, new Asset(dust, sym),
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

        // Membership changed, the agreed order is no longer valid
        this.clearOrder(id);

        sendTransferToken(TOKEN_CONTRACT, this.contract, account, refund, `artcircles: deposit refund, circle ${id}`);
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
            sendTransferToken(TOKEN_CONTRACT, this.contract, m.account, m.deposit, `artcircles: circle ${id} cancelled, deposit refund`);
            members.remove(m);
            m = next;
        }

        circle.members = 0;
        circle.state = STATE_CANCELLED;
        this.circles.update(circle, SAME_PAYER);
    }
}
