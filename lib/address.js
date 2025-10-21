import { cashaddr } from 'bech32cashaddr';
import { abytes, concatBytes } from './utils.js';

export const ADDRESS_PREFIXES = {
  mainnet: 'kaspa',
  testnet: 'kaspatest',
  simnet: 'kaspasim',
  devnet: 'kaspadev',
};

export const ADDRESS_VERSION = {
  pk: 0,
  'pk-ecdsa': 1,
  sh: 8,
};

export const ADDRESS_PAYLOAD_LENGTH = {
  pk: 32,
  'pk-ecdsa': 33,
  sh: 32,
};

const normalizePrefix = (prefix) => {
  if (typeof prefix !== 'string') throw new Error('Prefix must be string');
  return prefix.trim().toLowerCase();
};

const ensurePayloadLength = (prefix, type, payload) => {
  abytes(
    payload,
    // test payload length only for known prefixes
    Object.values(ADDRESS_PREFIXES).includes(prefix) ? ADDRESS_PAYLOAD_LENGTH[type] : undefined,
    'address.payload'
  );
  return payload;
};

export function Address(options = {}) {
  const prefix = normalizePrefix(options.prefix ?? ADDRESS_PREFIXES.mainnet);
  return {
    encode(data) {
      const version = ADDRESS_VERSION[data.type];
      if (version === undefined) throw new Error(`Unknown address type=${data.type}`);
      ensurePayloadLength(prefix, data.type, data.payload);
      const words = cashaddr.toWords(concatBytes(Uint8Array.of(version), data.payload));
      return cashaddr.encode(prefix, words);
    },
    decode(address) {
      const res = cashaddr.decode(address);
      if (prefix !== res.prefix) throw new Error(`Invalid prefix "${res.prefix}"`);
      const data = cashaddr.fromWords(res.words);
      const type = Object.entries(ADDRESS_VERSION).find(([type, version]) => data[0] === version)?.[0];
      if (!type) throw new Error(`Invalid address version=${data[0]}`);
      return {
        prefix,
        type,
        payload: ensurePayloadLength(prefix, type, data.subarray(1)),
      };
    },
  };
}
