// TEST ONLY: mock of eosio.proton::usersinfo with the same layout as on chain
import { Name, Table, TableStore, Contract, EMPTY_NAME } from "proton-tsc";

@packer
export class NameName extends Table {
    constructor(public first: Name = EMPTY_NAME, public second: Name = EMPTY_NAME) { super(); }
}

@packer
export class NameString extends Table {
    constructor(public first: Name = EMPTY_NAME, public second: string = "") { super(); }
}

@packer
export class KycProv extends Table {
    constructor(
        public kyc_provider: Name = EMPTY_NAME,
        public kyc_level: string = "",
        public kyc_date: u64 = 0
    ) { super(); }
}

@table("usersinfo")
export class UserInfo extends Table {
    constructor(
        public acc: Name = EMPTY_NAME,
        public name: string = "",
        public avatar: string = "",
        public verified: bool = false,
        public date: u64 = 0,
        public verifiedon: u64 = 0,
        public verifier: Name = EMPTY_NAME,
        public raccs: Name[] = [],
        public aacts: NameName[] = [],
        public ac: NameString[] = [],
        public kyc: KycProv[] = []
    ) { super(); }

    @primary
    get primary(): u64 { return this.acc.N; }
}

@contract
export class protonmock extends Contract {
    users: TableStore<UserInfo> = new TableStore<UserInfo>(this.receiver);

    @action("setuser")
    setuser(acc: Name, withKyc: bool): void {
        const kyc: KycProv[] = withKyc ? [new KycProv(Name.fromString("metallicus"), "1,2,3", 1700000000)] : [];
        const u = new UserInfo(acc, "Test " + acc.toString(), "avatar-data", false, 0, 0, EMPTY_NAME,
            [], [new NameName(acc, acc)], [new NameString(acc, "x")], kyc);
        this.users.set(u, this.receiver);
    }
}
