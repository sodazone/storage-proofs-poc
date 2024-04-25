import { ssz } from "@lodestar/types/deneb";
import type { TreeOffsetProof } from "@chainsafe/persistent-merkle-tree";
import { u8aToHex } from "@polkadot/util";
import Web3 from "web3";
import { sepoliaBeaconBlockHash, sepoliaEthAccount } from "./test-proofs";

const web3 = new Web3("https://lodestar-sepoliarpc.chainsafe.io");

async function getBeaconBody(blockId: string) {
  const res = await fetch(
    `https://lodestar-sepolia.chainsafe.io/eth/v2/beacon/blocks/${blockId}`,
  );
  const {
    data: { message },
  } = await res.json();
  return ssz.BeaconBlock.fromJson(message);
}

// "head" (canonical head in node's view), "genesis", "finalized", <slot>, <hex encoded blockRoot with 0x prefix>.
async function getBeaconProofs(blockId: string) {
  const beaconBlock = await getBeaconBody(blockId);
  const beaconProof = ssz.BeaconBlock.toView(beaconBlock).createProof([
    ["body", "execution_payload", "state_root"],
    ["body", "execution_payload", "receipts_root"],
  ]) as TreeOffsetProof;

  return { beaconBlock, beaconProof };
}

const beaconHash = sepoliaBeaconBlockHash;
const { beaconBlock, beaconProof } = await getBeaconProofs(beaconHash);

const accountProof = await web3.eth.getProof(
  sepoliaEthAccount,
  [
    "0x0000000000000000000000000000000000000000000000000000000000000012",
    "0x0000000000000000000000000000000000000000000000000000000000000013",
  ],
  beaconBlock.body.executionPayload.blockNumber,
);

console.log("Beacon Proof");
console.log({
  ...beaconProof,
  leaves: beaconProof.leaves.map((l) => u8aToHex(l)),
});

console.log("Account Proof");
console.log(accountProof);
