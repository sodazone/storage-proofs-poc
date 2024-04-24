use smoldot::trie::{
    self,
    proof_decode::{decode_and_verify_proof, Config, StorageValue},
};

use crate::StorageProofRecord;

#[derive(Debug, Clone, derive_more::Display)]
pub enum VerifyStorageProofError {
    IncompleteProofError,
    InvalidStorageProof,
    StorageValueError,
}
impl std::error::Error for VerifyStorageProofError {}

/// Verify the integrity of a storage proof record.
///
/// This function verifies the integrity of a storage proof record by decoding and verifying
/// the proof, and then comparing the retrieved storage value with the expected value.
///
/// # Arguments
///
/// * `record` - A `StorageProofRecord` containing the proof data and expected storage value.
///
/// # Returns
///
/// A `Result` containing either the retrieved storage value or an error if the verification fails.
///
pub fn verify_storage_proof(
    record: StorageProofRecord,
) -> Result<Vec<u8>, VerifyStorageProofError> {
    let decoded_proof = decode_and_verify_proof(Config::<Vec<u8>> {
        proof: record.proof,
    })
    .map_err(|_| VerifyStorageProofError::InvalidStorageProof)?;

    if let Ok(node_info) = decoded_proof.trie_node_info(
        &record.root_hash,
        trie::bytes_to_nibbles(record.storage_key.iter().copied()),
    ) {
        match node_info.storage_value {
            StorageValue::Known { value, .. } => {
                if record.storage_value.map_or(true, |v| v == value) {
                    Ok(value.to_vec())
                } else {
                    Err(VerifyStorageProofError::StorageValueError)
                }
            }
            _ => Err(VerifyStorageProofError::StorageValueError),
        }
    } else {
        Err(VerifyStorageProofError::IncompleteProofError)
    }
}
