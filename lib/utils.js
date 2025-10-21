import { schnorr, secp256k1 } from '@noble/curves/secp256k1.js';
import { bytesToNumberBE } from '@noble/curves/utils.js';
import { isBytes } from '@noble/hashes/utils.js';

export { concatBytes, bytesToHex, isBytes, hexToBytes } from '@noble/hashes/utils.js';
export { equalBytes } from '@noble/curves/utils.js';

export function abytes(value, length, title = '') {
  const bytes = isBytes(value);
  const len = value?.length;
  const needsLen = length !== undefined;
  if (!bytes || (needsLen && len !== length)) {
    const prefix = title && `"${title}" `;
    const ofLen = needsLen ? ` of length ${length}` : '';
    const got = bytes ? `length=${len}` : `type=${typeof value}`;
    throw new Error(prefix + 'expected Uint8Array' + ofLen + ', got ' + got);
  }
  return value;
}

export function aunumber(value, bits, name = 'value') {
  if (typeof value !== 'number') throw new Error(`${name} must be number, got ${typeof value}`);
  if (!Number.isInteger(value)) throw new Error(`${name} must be integer, got ${value}`);
  const max = 2 ** bits - 1;
  if (value < 0 || value > max) throw new Error(`${name} must be between 0 and ${max}, got ${value}`);
  return value;
}

export const au8 = (value, name) => aunumber(value, 8, name);
export const au16 = (value, name) => aunumber(value, 16, name);
export const au32 = (value, name) => aunumber(value, 32, name);

export const au64 = (value, name = 'value') => {
  if (typeof value !== 'bigint') throw new Error(`${name} must be bigint, got ${typeof value}`);
  if (value < 0n) throw new Error(`${name} must be non-negative, got ${value}`);
  return value;
};

export const PUBKEY_TYPES = Object.freeze({
  SCHNORR: 'schnorr',
  ECDSA: 'ecdsa',
});

export function validatePubkey(pubkey, type) {
  if (type === PUBKEY_TYPES.SCHNORR) {
    abytes(pubkey, 32, 'Schnorr publicKey');
    schnorr.utils.lift_x(bytesToNumberBE(pubkey));
    return pubkey;
  };
  if (type === PUBKEY_TYPES.ECDSA) {
    abytes(pubkey, 33, 'ECDSA publicKey');
    secp256k1.Point.fromBytes(pubkey);
    return pubkey;
  }
  throw new Error(`Unknown pubkey type ${type}`);
}
