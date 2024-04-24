import { WsProvider } from "@polkadot/api";
import type { Option, u32 } from "@polkadot/types";
import type { PersistedValidationData } from "@polkadot/types/interfaces";

import { SubstrateApis } from "@sodazone/ocelloids-sdk";

import { verify_storage_proof, type StorageProofRecord } from "..";
import { decodeHeadData, fromHexString, toHexString } from "./shapes";

type ProofRequest = {
  key: string;
  expected?: string;
};

type GenProofArgs = {
  paraProvider: WsProvider;
  relayProvider: WsProvider;
  proofRequest: ProofRequest;
};

async function genProof({
  paraProvider,
  relayProvider,
  proofRequest,
}: GenProofArgs) {
  const apis = new SubstrateApis({
    parachain: {
      provider: paraProvider,
    },
    relay: { provider: relayProvider },
  });

  await apis.promise.parachain.isReady;
  await apis.promise.relay.isReady;

  // 1. Get parachain validation data
  const paraId =
    await apis.promise.parachain.query.parachainInfo.parachainId<u32>();

  const res =
    await apis.promise.parachain.query.parachainSystem.validationData<
      Option<PersistedValidationData>
    >();
  const validationData = res.unwrap();

  // 2. Get parahead inclusion proof
  console.log(
    `Parahead Inclusion Proof @[relay#${validationData.relayParentNumber.toNumber()}]`,
  );

  const relayBlockHash = await apis.promise.relay.rpc.chain.getBlockHash(
    validationData.relayParentNumber,
  );
  const relayStateRoot = validationData.relayParentStorageRoot.toU8a();
  const parasHeadsKey = apis.promise.relay.query.paras.heads.key(paraId);
  const relayInclusionProof = await apis.promise.relay.rpc.state.getReadProof(
    [parasHeadsKey],
    relayBlockHash,
  );

  const paraHeadInclusionProof = {
    root_hash: Array.from(relayStateRoot),
    storage_key: fromHexString(parasHeadsKey),
    proof: Array.from(relayInclusionProof.proof.toU8a()),
  } as StorageProofRecord;

  const { blockNumber } = decodeHeadData(
    await verify_storage_proof(paraHeadInclusionProof),
  );

  console.log({
    relayBlockHash: relayBlockHash.toHuman(),
    relayStateRoot: toHexString(paraHeadInclusionProof.root_hash),
    parasHeadsKey: toHexString(paraHeadInclusionProof.storage_key),
    paraHeadProof: toHexString(paraHeadInclusionProof.proof),
  });

  // 3. Get storage proof
  console.log(`Storage Proof @[${paraId.toNumber()}#${blockNumber}]`);

  const paraBlockHash =
    await apis.promise.parachain.rpc.chain.getBlockHash(blockNumber);
  const paraBlockHeader =
    await apis.promise.parachain.rpc.chain.getHeader(paraBlockHash);

  const proof = await apis.promise.parachain.rpc.state.getReadProof(
    [proofRequest.key],
    paraBlockHash,
  );

  const proofRecord = {
    root_hash: Array.from(paraBlockHeader.stateRoot.toU8a()),
    storage_key: fromHexString(proofRequest.key),
    proof: Array.from(proof.proof.toU8a()),
    storage_value: proofRequest.expected
      ? fromHexString(proofRequest.expected)
      : undefined,
  } as StorageProofRecord;

  const storageValue = await verify_storage_proof(proofRecord);

  console.log({
    blockHash: paraBlockHash.toHuman(),
    rootHash: toHexString(proofRecord.root_hash),
    storageKey: toHexString(proofRecord.storage_key),
    storageValue: toHexString(storageValue),
    proof: toHexString(proofRecord.proof),
  });
}

// Snowbridge beacon
const relayProvider = new WsProvider("wss://rococo-rpc.polkadot.io");
const paraProvider = new WsProvider("wss://rococo-bridge-hub-rpc.polkadot.io");
// ethereumBeaconClient.latestFinalizedBlockRoot
const proofRequest: ProofRequest = {
  key: "0xada12a87b9ccce83f328569cf9934e83aaa3a3f8a1e4e6954765520b96222940",
};

// AH balance
// const relayProvider = new WsProvider("wss://rpc.polkadot.io");
// const paraProvider = new WsProvider("wss://polkadot-asset-hub-rpc.polkadot.io");
// const proofRequest: ProofRequest = {
//  key: "0x26aa394eea5630e07c48ae0c9558cef7b99d880ec681799c0cf30e8886371da990b6346227456bd049506695ac7f4ecc3ceaf1c4e92a3ed0e47ce5157249557057e45ce0b629754d9c3488fdce868b46",
//  expected: "0x0000000001000000010000000000000000e1f505000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000080"
// }

try {
  await genProof({
    relayProvider,
    paraProvider,
    proofRequest,
  });
  process.exit(0);
} catch (error) {
  console.log(error);
  process.exit(1);
}
