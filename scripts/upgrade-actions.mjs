// Builds the setcode + setabi actions for a multisig contract upgrade.
// Usage: node scripts/upgrade-actions.mjs [account] > upgrade-actions.json
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { ABI, Serializer } from "@greymass/eosio";

const account = process.argv[2] || "artcircles";
const wasm = readFileSync("target/artcircles.contract.wasm");
const abiJson = JSON.parse(readFileSync("target/artcircles.contract.abi", "utf8"));
const abiHex = Serializer.encode({ object: ABI.from(abiJson) }).hexString;
const auth = [{ actor: account, permission: "active" }];

console.error(`wasm sha256: ${createHash("sha256").update(wasm).digest("hex")}`);
console.error(`wasm ${wasm.length} bytes, abi ${abiHex.length / 2} bytes`);

console.log(JSON.stringify([
  { account: "eosio", name: "setcode", authorization: auth,
    data: { account, vmtype: 0, vmversion: 0, code: wasm.toString("hex") } },
  { account: "eosio", name: "setabi", authorization: auth,
    data: { account, abi: abiHex } },
]));
