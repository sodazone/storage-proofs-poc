# Storage Proofs (PoC)

This is a proof of concept of cross-chain storage proofs, showing how to verify storage proofs for arbitrary parachain storage without relying on direct access to the parachain. Instead, it utilizes a relay's state root hash as a root of trust.

## Installation

To begin, clone this repository and install the required dependencies:

```shell
bun install
```

## Quickstart

Verify proof data located in `poc/test-proofs.ts` with this command:

```shell
bun verify
```

```
Polkadot Assethub Balance Proof
- key: 0x26aa394eea5630e07c48ae0c9558cef7b99d880ec681799c0cf30e8886371da990b6346227456bd049506695ac7f4ecc3ceaf1c4e92a3ed0e47ce5157249557057e45ce0b629754d9c3488fdce868b46
- val: 0x0000000001000000010000000000000000e1f505000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000080
Rococo Snowbridge Beacon Proof
- key: 0xada12a87b9ccce83f328569cf9934e83aaa3a3f8a1e4e6954765520b96222940
- val: 0xe93ed315e3d0617d31545346053131a1508cafa99fb27d24fb01c6bdf46aaa1a
```

Generate your own proof data using the following command:

```shell
bun proof
```

Refer to `poc/proof.ts` for details.

## Development

> [!NOTE]
> You'll need Cargo to compile the oc-proofs WebAssembly module.

To create the wasm package:

```shell
bun wasm
```

You can find a pre-compiled package in `dist/`.

---

:zap::zap:


