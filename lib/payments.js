import * as P from 'micro-packed';

import { Script } from './script.js';
import { ADDRESS_VERSION, Address } from './address.js';
import { PUBKEY_TYPES, isBytes, validatePubkey } from './utils.js';

export const MAX_SCRIPT_PUBLIC_KEY_VERSION = 0;

function isValidPubkey(pubkey, type) {
  try {
    validatePubkey(pubkey, type);
    return true;
  } catch {
    return false;
  }
}

const OutPK = {
  encode(script) {
    if (script.length !== 2) return;
    const [payload, op] = script;
    if (!isBytes(payload) || !isValidPubkey(payload, PUBKEY_TYPES.SCHNORR)) return;
    if (op !== 'OP_CHECKSIG') return;
    return { type: 'pk', payload };
  },
  decode(payment) {
    if (payment.type !== 'pk') return;
    return [payment.payload, 'OP_CHECKSIG'];
  },
};

const OutPKECDSA = {
  encode(script) {
    if (script.length !== 2) return;
    const [payload, op] = script;
    if (!isBytes(payload) || !isValidPubkey(payload, PUBKEY_TYPES.ECDSA)) return;
    if (op !== 'OP_CHECKSIG_ECDSA') return;
    return { type: 'pk-ecdsa', payload };
  },
  decode(payment) {
    if (payment.type !== 'pk-ecdsa') return;
    return [payment.payload, 'OP_CHECKSIG_ECDSA'];
  },
};

const OutP2SH = {
  encode(script) {
    if (script.length !== 3) return;
    const [op, payload, equal] = script;
    if (op !== 'OP_BLAKE2B' || equal !== 'OP_EQUAL') return;
    if (!isBytes(payload) || payload.length !== 32) return;
    return { type: 'sh', payload };
  },
  decode(payment) {
    if (payment.type !== 'sh') return;
    return ['OP_BLAKE2B', payment.payload, 'OP_EQUAL'];
  },
};

const OutUnknown = {
  encode(script) {
    return { type: 'unknown', script: Script.encode(script) };
  },
  decode(payment) {
    if (payment.type !== 'unknown') return;
    return Script.decode(payment.script);
  },
};

const OutScriptCoder = P.apply(Script, P.coders.match([OutPK, OutPKECDSA, OutP2SH, OutUnknown]));

export const OutScript = {
  encode(payment) {
    if (payment.version !== MAX_SCRIPT_PUBLIC_KEY_VERSION) {
      throw new Error(`OutScript/${payment.type}: unsupported version ${payment.version}`);
    }
    if (payment.type === 'pk' && !isValidPubkey(payment.payload, PUBKEY_TYPES.SCHNORR)) {
      throw new Error('OutScript/pk: wrong key');
    }
    if (payment.type === 'pk-ecdsa' && !isValidPubkey(payment.payload, PUBKEY_TYPES.ECDSA)) {
      throw new Error('OutScript/pk-ecdsa: wrong key');
    }
    if (payment.type === 'sh'
      && (!isBytes(payment.payload) || payment.payload.length !== 32)) {
      throw new Error('OutScript/sh: wrong hash');
    }
    return {
      version: payment.version,
      script: OutScriptCoder.encode(payment),
    };
  },
  decode({ version, script }) {
    if (typeof version !== 'number') throw new Error('OutScript: version must be number');
    if (!isBytes(script)) throw new Error('OutScript: script must be bytes');
    if (version !== MAX_SCRIPT_PUBLIC_KEY_VERSION) {
      return { version, type: 'unknown', script };
    }
    return { version, ...OutScriptCoder.decode(script) };
  },
};

export function p2pk(pubkey, options) {
  return {
    type: 'pk',
    address: Address(options).encode({ version: ADDRESS_VERSION.PUBKEY, payload: pubkey }),
    ...OutScript.encode({
      version: MAX_SCRIPT_PUBLIC_KEY_VERSION,
      type: 'pk',
      payload: pubkey,
    }),
  };
}

export function p2pkECDSA(pubkey, options) {
  return {
    type: 'pk-ecdsa',
    address: Address(options).encode({ version: ADDRESS_VERSION.PUBKEY_ECDSA, payload: pubkey }),
    ...OutScript.encode({
      version: MAX_SCRIPT_PUBLIC_KEY_VERSION,
      type: 'pk-ecdsa',
      payload: pubkey,
    }),
  };
}
