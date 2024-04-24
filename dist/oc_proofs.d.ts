/* tslint:disable */
/* eslint-disable */
/**
* @param {any} val
* @returns {Promise<any>}
*/
export function verify_storage_proof(val: any): Promise<any>;
export interface StorageProofRecord {
    root_hash: number[];
    proof: number[];
    storage_key: number[];
    storage_value: number[] | undefined;
}

