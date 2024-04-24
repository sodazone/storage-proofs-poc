import assert from "node:assert";

import { verify_storage_proof, type StorageProofRecord } from "..";
import { decodeHeadData, fromHexString, toHexString } from "./shapes";
import {
  AssethubBalanceProof,
  SnowbridgeBeaconProof,
  type ProofData,
} from "./test-proofs";

async function verify({ trusted, paraHeadProof, storageProof }: ProofData) {
  try {
    const headerData = decodeHeadData(
      await verify_storage_proof({
        root_hash: fromHexString(trusted.relayStateRoot),
        storage_key: fromHexString(trusted.parasHeadsKey),
        proof: fromHexString(paraHeadProof),
      } as StorageProofRecord),
    );

    assert.equal(
      storageProof.rootHash,
      toHexString(headerData.stateRoot),
      "Parachain state root does not match inclusion proof",
    );

    const balanceValue = await verify_storage_proof({
      root_hash: fromHexString(storageProof.rootHash),
      storage_key: fromHexString(storageProof.storageKey),
      storage_value: storageProof.storageValue
        ? fromHexString(storageProof.storageValue)
        : undefined,
      proof: fromHexString(storageProof.proof),
    } as StorageProofRecord);

    console.log(
      `- key: ${storageProof.storageKey}\n- val: ${toHexString(balanceValue)}`,
    );
  } catch (error) {
    console.error(`Failed Verification (${error})`);
  }
}

console.log("Polkadot Assethub Balance Proof");
await verify(AssethubBalanceProof);

console.log("Rococo Snowbridge Beacon Proof");
await verify(SnowbridgeBeaconProof);
