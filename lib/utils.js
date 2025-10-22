import { bytesToNumberBE } from '@noble/curves/utils.js';
import { isBytes } from '@noble/hashes/utils.js';
import { schnorr, secp256k1 } from '@noble/curves/secp256k1.js';

export { concatBytes, bytesToHex, isBytes, hexToBytes } from '@noble/hashes/utils.js';
export { equalBytes } from '@noble/curves/utils.js';

/**
 * Assert that a value is a Uint8Array of the expected length.
 * @param {Uint8Array} value - Bytes to validate.
 * @param {number} [length] - Required length; skip when undefined.
 * @param {string} [title] - Human-friendly field label.
 * @returns {Uint8Array} Validated byte array.
 */
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

/**
 * Assert that a value is an unsigned integer within the given bit width.
 * @param {number} value - Number to validate.
 * @param {number} bits - Bit width, e.g. 8, 16, 32.
 * @param {string} [name] - Field label for error messages (defaults to "value").
 * @returns {number} Validated integer.
 */
export function aunumber(value, bits, name = 'value') {
  if (typeof value !== 'number') throw new Error(`${name} must be number, got ${typeof value}`);
  if (!Number.isInteger(value)) throw new Error(`${name} must be integer, got ${value}`);
  const max = 2 ** bits - 1;
  if (value < 0 || value > max) throw new Error(`${name} must be between 0 and ${max}, got ${value}`);
  return value;
}

/**
 * Validate an unsigned 8-bit integer.
 * @param {number} value - Number to validate.
 * @param {string} [name] - Field label for error messages.
 * @returns {number} Validated integer.
 */
export const au8 = (value, name) => aunumber(value, 8, name);
/**
 * Validate an unsigned 16-bit integer.
 * @param {number} value - Number to validate.
 * @param {string} [name] - Field label for error messages.
 * @returns {number} Validated integer.
 */
export const au16 = (value, name) => aunumber(value, 16, name);
/**
 * Validate an unsigned 32-bit integer.
 * @param {number} value - Number to validate.
 * @param {string} [name] - Field label for error messages.
 * @returns {number} Validated integer.
 */
export const au32 = (value, name) => aunumber(value, 32, name);

/**
 * Assert that a value is a non-negative bigint.
 * @param {bigint} value - BigInt to validate.
 * @param {string} [name] - Field label for error messages (defaults to "value").
 * @returns {bigint} Validated bigint.
 */
export const au64 = (value, name = 'value') => {
  if (typeof value !== 'bigint') throw new Error(`${name} must be bigint, got ${typeof value}`);
  if (value < 0n) throw new Error(`${name} must be non-negative, got ${value}`);
  return value;
};

export const PUBKEY_TYPES = Object.freeze({
  SCHNORR: 'schnorr',
  ECDSA: 'ecdsa',
});

/**
 * Ensure a public key matches the requested Kaspa key type.
 * @param {Uint8Array} pubkey - Public key bytes.
 * @param {'schnorr' | 'ecdsa'} type - Expected key type identifier.
 * @returns {Uint8Array} Validated public key.
 */
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
