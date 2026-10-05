import { Name, Table, EMPTY_NAME } from "proton-tsc";

// Layout of eosio.proton::usersinfo (taken from the on-chain ABI).
// Only field order and types matter for deserialization.

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

@table("usersinfo", noabigen)
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
