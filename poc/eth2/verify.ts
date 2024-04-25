import assert from "node:assert";

import { ssz } from "@lodestar/types/deneb";
import type { TreeOffsetProof } from "@chainsafe/persistent-merkle-tree";
import { Trie } from "@ethereumjs/trie";
import { RLP } from "@ethereumjs/rlp";
import { toBuffer, bufferToBigInt, bufferToHex } from "@ethereumjs/util";
import { hexToU8a, u8aToHex } from "@polkadot/util";

import {
  sepoliaBeacon,
  sepoliaExecutionProof,
  sepoliaBeaconBlockHash,
  type ExecutionProof,
  sepoliaEthAccount,
} from "./test-proofs";

async function verify(
  beaconBlockHash: string,
  beaconProof: TreeOffsetProof,
  executionProof: ExecutionProof,
) {
  const beaconBlock = ssz.BeaconBlock.createFromProof(beaconProof);

  assert.equal(u8aToHex(beaconBlock.hashTreeRoot()), beaconBlockHash);

  const { executionPayload } = beaconBlock.body;

  console.log("Beacon Root\t\t\t", u8aToHex(beaconBlock.hashTreeRoot()));
  console.log("└── Body Root\t\t\t", u8aToHex(beaconBlock.body.hashTreeRoot()));
  console.log(
    "    └── Execution Root\t\t",
    u8aToHex(executionPayload.hashTreeRoot()),
  );
  console.log(
    "        ├──Receipts Root\t",
    u8aToHex(executionPayload.receiptsRoot),
  );
  console.log(
    "        └── State Root\t\t",
    u8aToHex(executionPayload.stateRoot),
  );

  const accountTrie = new Trie({
    root: Buffer.from(executionPayload.stateRoot),
    useKeyHashing: true,
  });
  await accountTrie.fromProof(
    executionProof.accountProof.map((p: string) => toBuffer(p)),
  );
  const accountVal = await accountTrie.get(toBuffer(sepoliaEthAccount), true);
  const storageHash = RLP.decode(accountVal)[2] as Buffer;

  console.log(
    "            └── Storage Hash\t",
    bufferToHex(storageHash),
    sepoliaEthAccount,
  );

  const storageTrie = new Trie({
    root: storageHash,
    useKeyHashing: true,
  });
  await storageTrie.fromProof(
    executionProof.storageProof[1].proof.map((p: string) => toBuffer(p)),
  );
  const storageVal = await storageTrie.get(
    toBuffer(
      "0x0000000000000000000000000000000000000000000000000000000000000013",
    ),
  );

  assert(storageVal !== null);

  const bn = bufferToBigInt(RLP.decode(storageVal) as Buffer);
  assert.equal(bn, 359137n);
}

try {
  await verify(
    sepoliaBeaconBlockHash,
    {
      ...sepoliaBeacon,
      leaves: sepoliaBeacon.leaves.map((l) => hexToU8a(l)),
    } as TreeOffsetProof,
    sepoliaExecutionProof,
  );
} catch (error) {
  console.error(error);
}
