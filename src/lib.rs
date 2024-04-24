#![allow(non_snake_case)]

use serde::{Deserialize, Serialize};
use tsify::Tsify;

use wasm_bindgen::prelude::*;

mod verify;

#[derive(Tsify, Serialize, Deserialize)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct StorageProofRecord {
    /// The state root hash
    pub root_hash: [u8; 32],
    /// SCALE encoded proof, i.e. Vec<Vec<u8>> with compact len prefixes
    pub proof: Vec<u8>,
    /// The storage key to be verified
    pub storage_key: Vec<u8>,
    /// The expected value
    pub storage_value: Option<Vec<u8>>,
}

#[wasm_bindgen]
pub async fn verify_storage_proof(val: JsValue) -> Result<JsValue, JsError> {
    let storage_proof_record: StorageProofRecord = serde_wasm_bindgen::from_value(val)?;
    let result = verify::verify_storage_proof(storage_proof_record)?;

    Ok(serde_wasm_bindgen::to_value(&result)?)
}
