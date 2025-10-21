import { blake2b } from '@noble/hashes/blake2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { schnorr } from '@noble/curves/secp256k1.js';
import * as P from 'micro-packed';

import { Address } from './address.js';
import { Script } from './script.js';
import { OutScript } from './payments.js'
import { au8, au16, au32, au64, concatBytes, bytesToHex, abytes, isBytes, equalBytes } from './utils.js';

export { Address, ADDRESS_PREFIXES, ADDRESS_VERSION } from './address.js';
export { Script, OP, MAX_SCRIPT_ELEMENT_SIZE, MAX_SCRIPT_SIZE } from './script.js';
export { OutScript, MAX_SCRIPT_PUBLIC_KEY_VERSION, p2pk, p2pkECDSA } from './payments.js';
export {
  utxoPlurality,
  transactionComputeMass,
  transactionStorageMass,
  transactionMass,
  STORAGE_MASS_PARAMETER,
  SOMPI_PER_KASPA,
  UTXO_CONST_STORAGE,
  UTXO_UNIT_SIZE,
} from './mass.js';

const KEY_TRANSACTION_HASH = new TextEncoder().encode('TransactionHash');
const KEY_TRANSACTION_ID = new TextEncoder().encode('TransactionID');
const KEY_TRANSACTION_SIGNING_HASH = new TextEncoder().encode('TransactionSigningHash');

const ZERO_HASH = new Uint8Array(32);
const EMPTY = new Uint8Array(0);
const SUBNETWORK_NATIVE = new Uint8Array(20);
const SIG_HASH_ALL = 0x01;

const VarBytes64 = P.bytes(P.apply(P.U64LE, P.coders.numberBigint));
const KaspaArray = (coder) => P.array(P.apply(P.U64LE, P.coders.numberBigint), coder);

/**
 * @typedef {Object} TransactionOutpoint
 * @property {Uint8Array} transactionId - Referenced transaction identifier
 * @property {number} index - Output index within the referenced transaction
 * @property {bigint} amount - Amount of the referenced output in sompis
 * @property {number} version - Script version of the referenced output
 * @property {Uint8Array} script - Locking script of the referenced output
 */

const RawOutpoint = P.struct({
  transactionId: P.bytes(32),
  index: P.U32LE,
});

/**
 * @typedef {Object} TransactionInput
 * @property {TransactionOutpoint} utxo - Referenced UTXO metadata
 * @property {Uint8Array} script - Unlocking script bytes
 * @property {bigint} sequence - Sequence number
 * @property {number} sigOpCount - Declared signature operation count for mass calculation
 * @property {string|number[]} [bip32DerivationPath] - BIP32 derivation path
 */

const RawInput = P.struct({
  utxo: RawOutpoint,
  script: VarBytes64,
  sequence: P.U64LE,
  sigOpCount: P.U8,
});

/**
 * @typedef {Object} TransactionOutput
 * @property {bigint} amount - Amount in sompis
 * @property {number} version - Script version
 * @property {Uint8Array} script - Locking script
 */

const RawOutput = P.struct({
  amount: P.U64LE,
  version: P.U16LE,
  script: VarBytes64,
});

/**
 * @typedef {Object} Transaction
 * @property {number} version - Transaction format version
 * @property {TransactionInput[]} inputs - Ordered list of inputs
 * @property {TransactionOutput[]} outputs - Ordered list of outputs
 * @property {bigint} lockTime - Absolute or relative lock constraint
 * @property {Uint8Array} subnetworkId - 20-byte subnetwork identifier
 * @property {bigint} gas - Virtual gas limit for subnetwork execution
 * @property {Uint8Array} payload - Arbitrary payload committed by the transaction
 * @property {bigint} mass - Storage-mass commitment (KIP-0009)
 * @property {Uint8Array} id - Transaction identifier
 */

export const RawTx = P.struct({
  version: P.U16LE,
  inputs: KaspaArray(RawInput),
  outputs: KaspaArray(RawOutput),
  lockTime: P.U64LE,
  subnetworkId: P.bytes(20),
  gas: P.U64LE,
  payload: VarBytes64,
  mass: P.U64LE,
});

const createKeyedBlake2b = (key) => blake2b.create({ dkLen: 32, key });

const hashOutpoint = (hasher, outpoint) => {
  abytes(outpoint.transactionId, 32, 'utxo.transactionId');
  hasher.update(outpoint.transactionId);
  hasher.update(P.U32LE.encode(outpoint.index));
};

const hashScriptPublicKey = (hasher, spk) => {
  hasher.update(P.U16LE.encode(spk.version));
  hasher.update(VarBytes64.encode(spk.script));
};

const previousOutputsHash = (tx) => {
  const hasher = createKeyedBlake2b(KEY_TRANSACTION_SIGNING_HASH);
  for (const input of tx.inputs) {
    hashOutpoint(hasher, input.utxo);
  }
  return hasher.digest();
};

const sequencesHash = (tx) => {
  const hasher = createKeyedBlake2b(KEY_TRANSACTION_SIGNING_HASH);
  for (const input of tx.inputs) hasher.update(P.U64LE.encode(input.sequence));
  return hasher.digest();
};

const sigOpCountsHash = (tx) => {
  const hasher = createKeyedBlake2b(KEY_TRANSACTION_SIGNING_HASH);
  for (const input of tx.inputs) hasher.update(Uint8Array.of(input.sigOpCount));
  return hasher.digest();
};

const outputsHash = (tx) => {
  const hasher = createKeyedBlake2b(KEY_TRANSACTION_SIGNING_HASH);
  for (const output of tx.outputs) {
    hasher.update(P.U64LE.encode(output.amount));
    hasher.update(P.U16LE.encode(output.version));
    hasher.update(VarBytes64.encode(output.script));
  }
  return hasher.digest();
};

const payloadHash = (tx) => {
  if (equalBytes(tx.subnetworkId, SUBNETWORK_NATIVE) && tx.payload.length === 0) return ZERO_HASH;
  const hasher = createKeyedBlake2b(KEY_TRANSACTION_SIGNING_HASH);
  hasher.update(VarBytes64.encode(tx.payload));
  return hasher.digest();
};

const calcSchnorrSignatureHash = (tx, input) => {
  const hasher = createKeyedBlake2b(KEY_TRANSACTION_SIGNING_HASH);
  hasher.update(P.U16LE.encode(tx.version));
  hasher.update(previousOutputsHash(tx));
  hasher.update(sequencesHash(tx));
  hasher.update(sigOpCountsHash(tx));
  hashOutpoint(hasher, input.utxo);
  hashScriptPublicKey(hasher, input.utxo);
  hasher.update(P.U64LE.encode(input.utxo.amount));
  hasher.update(P.U64LE.encode(input.sequence));
  hasher.update(Uint8Array.of(input.sigOpCount));
  hasher.update(outputsHash(tx));
  hasher.update(P.U64LE.encode(tx.lockTime));
  hasher.update(tx.subnetworkId);
  hasher.update(P.U64LE.encode(tx.gas));
  hasher.update(payloadHash(tx));
  hasher.update(Uint8Array.of(SIG_HASH_ALL));
  return hasher.digest();
};

const hashTransaction = (tx, { full = true } = {}) => {
  const hasher = createKeyedBlake2b(!full ? KEY_TRANSACTION_ID : KEY_TRANSACTION_HASH);
  hasher.update(P.U16LE.encode(tx.version));
  hasher.update(P.U64LE.encode(BigInt(tx.inputs.length)));
  for (const input of tx.inputs) {
    hashOutpoint(hasher, input.utxo);
    if (full) {
      hasher.update(VarBytes64.encode(input.script));
      hasher.update(Uint8Array.of(input.sigOpCount));
    } else {
      hasher.update(VarBytes64.encode(EMPTY));
    }
    hasher.update(P.U64LE.encode(input.sequence));
  }
  hasher.update(P.U64LE.encode(BigInt(tx.outputs.length)));
  for (const output of tx.outputs) {
    hasher.update(P.U64LE.encode(output.amount));
    hasher.update(P.U16LE.encode(output.version));
    hasher.update(VarBytes64.encode(output.script));
  }
  hasher.update(P.U64LE.encode(tx.lockTime));
  hasher.update(tx.subnetworkId);
  hasher.update(P.U64LE.encode(tx.gas));
  hasher.update(VarBytes64.encode(tx.payload));
  if (full && tx.mass > 0n) hasher.update(P.U64LE.encode(tx.mass));
  return hasher.digest();
};

const normalizeOutpoint = (utxo = {}) => {
  const {
    transactionId = new Uint8Array(32),
    index = 0,
    amount = 0n,
    version = 0,
    script = new Uint8Array(),
    ...rest
  } = utxo;
  return {
    transactionId: Uint8Array.from(abytes(transactionId, 32, 'utxo.transactionId')),
    index: au32(index, 'utxo.index'),
    amount: au64(amount, 'utxo.amount'),
    version: au16(version, 'utxo.version'),
    script: Uint8Array.from(abytes(script, undefined, 'utxo.script')),
    ...rest,
  };
};

const normalizeInput = (input) => {
  const {
    utxo,
    script = new Uint8Array(),
    sequence = 0n,
    sigOpCount = 1,
    ...rest
  } = input ?? {};
  return {
    utxo: normalizeOutpoint(utxo),
    script: Uint8Array.from(abytes(script, undefined, 'input.script')),
    sequence: au64(sequence, 'input.sequence'),
    sigOpCount: au8(sigOpCount, 'input.sigOpCount'),
    ...rest,
  };
};

const normalizeOutput = (output) => {
  const { amount = 0n, version = 0, script = new Uint8Array(), ...rest } = output ?? {};
  return {
    amount: au64(amount, 'output.amount'),
    version: au16(version, 'output.version'),
    script: Uint8Array.from(abytes(script, undefined, 'output.script')),
    ...rest,
  };
};

const deriveFromHDKey = (key, path) => {
  if (typeof path === 'string') return key.derive(path).privateKey;
  if (!Array.isArray(path)) throw new Error('derivation path must be string or number[]');
  let current = key;
  for (const index of path) current = current.deriveChild(index);
  if (!current.privateKey) throw new Error('HDKey child is public only');
  return current.privateKey;
};

const toRpcU64 = (value, name) => au64(value, name).toString(10);
const toRpcHex = (bytes, len, name) => bytesToHex(abytes(bytes, len, name));

export class Transaction {
  constructor({
    version = 0,
    inputs = [],
    outputs = [],
    lockTime = 0n,
    subnetworkId = SUBNETWORK_NATIVE,
    gas = 0n,
    payload = EMPTY,
    mass = 0n,
  } = {}) {
    this.version = au16(version, 'version');
    this.inputs = inputs.map((input) => normalizeInput(input));
    this.outputs = outputs.map((output) => normalizeOutput(output));
    this.lockTime = au64(lockTime, 'lockTime');
    this.subnetworkId = Uint8Array.from(abytes(subnetworkId, 20, 'subnetworkId'));
    this.gas = au64(gas, 'gas');
    this.payload = Uint8Array.from(abytes(payload, undefined, 'payload'));
    this.mass = au64(mass, 'mass');
  }

  static fromBytes(bytes) {
    const decoded = RawTx.decode(bytes);
    return new Transaction({
      version: decoded.version,
      inputs: decoded.inputs,
      outputs: decoded.outputs,
      lockTime: decoded.lockTime,
      subnetworkId: decoded.subnetworkId,
      gas: decoded.gas,
      payload: decoded.payload,
      mass: decoded.mass,
    });
  }

  toBytes() {
    return RawTx.encode({
      version: this.version,
      inputs: this.inputs,
      outputs: this.outputs,
      lockTime: this.lockTime,
      subnetworkId: this.subnetworkId,
      gas: this.gas,
      payload: this.payload,
      mass: this.mass,
    });
  }

  toRPCTransaction() {
    const inputs = this.inputs.map((input, idx) => {
      if (!input?.utxo) throw new Error(`inputs[${idx}].utxo is required`);
      return {
        previousOutpoint: {
          transactionId: toRpcHex(input.utxo.transactionId, 32, `inputs[${idx}].utxo.transactionId`),
          index: au32(input.utxo.index ?? 0, `inputs[${idx}].utxo.index`),
        },
        signatureScript: toRpcHex(input.script ?? EMPTY, undefined, `inputs[${idx}].script`),
        sequence: toRpcU64(input.sequence, `inputs[${idx}].sequence`),
        sigOpCount: au8(input.sigOpCount ?? 1, `inputs[${idx}].sigOpCount`),
      };
    });

    const outputs = this.outputs.map((output, idx) => {
      return {
        amount: toRpcU64(output.amount, `outputs[${idx}].amount`),
        scriptPublicKey: {
          version: au16(output.version ?? 0, `outputs[${idx}].version`),
          scriptPublicKey: toRpcHex(output.script, undefined, `outputs[${idx}].script`),
        },
      };
    });

    return {
      version: au16(this.version),
      inputs,
      outputs,
      lockTime: toRpcU64(this.lockTime, 'lockTime'),
      subnetworkId: toRpcHex(this.subnetworkId, 20, 'subnetworkId'),
      gas: toRpcU64(this.gas, 'gas'),
      payload: toRpcHex(this.payload, undefined, 'payload'),
      mass: toRpcU64(this.mass, 'mass'),
    };
  }

  get id() {
    return hashTransaction(this, { full: false });
  }

  get hash() {
    return hashTransaction(this, { full: true });
  }

  sign(privateKeyOrHDKey) {
    const isHDKey = !isBytes(privateKeyOrHDKey);
    if (!isHDKey) abytes(privateKeyOrHDKey, 32, 'privateKey');
    for (let idx = 0; idx < this.inputs.length; idx++) {
      const input = this.inputs[idx];
      if (isHDKey && !input.bip32DerivationPath)
        throw new Error(`inputs[${idx}] Missing bip32DerivationPath`)
      const privKey = isHDKey ? deriveFromHDKey(privateKeyOrHDKey, input.bip32DerivationPath) : privateKeyOrHDKey;
      const pubKey = schnorr.getPublicKey(privKey);
      // support only P2PK
      const { script: lockScript } = OutScript.encode({ version: 0, type: 'pk', payload: pubKey });
      if (!equalBytes(lockScript, input.utxo.script))
        throw new Error(`inputs[${idx}] Derived script does not match UTXO script`);
      const message = calcSchnorrSignatureHash(this, input);
      const signature = schnorr.sign(message, privKey);
      input.script = Script.encode([concatBytes(signature, Uint8Array.of(SIG_HASH_ALL))]);
    }
    return true;
  }
}
