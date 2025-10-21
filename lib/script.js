import * as P from 'micro-packed';

import { isBytes } from './utils.js';

export const OP = Object.freeze({
  OP_0: 0x00,
  OP_PUSHDATA1: 0x4c,
  OP_PUSHDATA2: 0x4d,
  OP_PUSHDATA4: 0x4e,
  OP_1NEGATE: 0x4f,
  OP_RESERVED: 0x50,
  OP_1: 0x51,
  OP_1: 0x51,
  OP_2: 0x52,
  OP_3: 0x53,
  OP_4: 0x54,
  OP_5: 0x55,
  OP_6: 0x56,
  OP_7: 0x57,
  OP_8: 0x58,
  OP_9: 0x59,
  OP_10: 0x5a,
  OP_11: 0x5b,
  OP_12: 0x5c,
  OP_13: 0x5d,
  OP_14: 0x5e,
  OP_15: 0x5f,
  OP_16: 0x60,
  OP_NOP: 0x61,
  OP_VER: 0x62,
  OP_IF: 0x63,
  OP_NOTIF: 0x64,
  OP_VERIF: 0x65,
  OP_VERNOTIF: 0x66,
  OP_ELSE: 0x67,
  OP_ENDIF: 0x68,
  OP_VERIFY: 0x69,
  OP_RETURN: 0x6a,
  OP_TOALTSTACK: 0x6b,
  OP_FROMALTSTACK: 0x6c,
  OP_2DROP: 0x6d,
  OP_2DUP: 0x6e,
  OP_3DUP: 0x6f,
  OP_2OVER: 0x70,
  OP_2ROT: 0x71,
  OP_2SWAP: 0x72,
  OP_IFDUP: 0x73,
  OP_DEPTH: 0x74,
  OP_DROP: 0x75,
  OP_DUP: 0x76,
  OP_NIP: 0x77,
  OP_OVER: 0x78,
  OP_PICK: 0x79,
  OP_ROLL: 0x7a,
  OP_ROT: 0x7b,
  OP_SWAP: 0x7c,
  OP_TUCK: 0x7d,
  OP_CAT: 0x7e,
  OP_SUBSTR: 0x7f,
  OP_LEFT: 0x80,
  OP_RIGHT: 0x81,
  OP_SIZE: 0x82,
  OP_INVERT: 0x83,
  OP_AND: 0x84,
  OP_OR: 0x85,
  OP_XOR: 0x86,
  OP_EQUAL: 0x87,
  OP_EQUALVERIFY: 0x88,
  OP_RESERVED1: 0x89,
  OP_RESERVED2: 0x8a,
  OP_1ADD: 0x8b,
  OP_1SUB: 0x8c,
  OP_2MUL: 0x8d,
  OP_2DIV: 0x8e,
  OP_NEGATE: 0x8f,
  OP_ABS: 0x90,
  OP_NOT: 0x91,
  OP_0NOTEQUAL: 0x92,
  OP_ADD: 0x93,
  OP_SUB: 0x94,
  OP_MUL: 0x95,
  OP_DIV: 0x96,
  OP_MOD: 0x97,
  OP_LSHIFT: 0x98,
  OP_RSHIFT: 0x99,
  OP_BOOLAND: 0x9a,
  OP_BOOLOR: 0x9b,
  OP_NUMEQUAL: 0x9c,
  OP_NUMEQUALVERIFY: 0x9d,
  OP_NUMNOTEQUAL: 0x9e,
  OP_LESSTHAN: 0x9f,
  OP_GREATERTHAN: 0xa0,
  OP_LESSTHANOREQUAL: 0xa1,
  OP_GREATERTHANOREQUAL: 0xa2,
  OP_MIN: 0xa3,
  OP_MAX: 0xa4,
  OP_WITHIN: 0xa5,
  OP_SHA256: 0xa8,
  OP_CHECKMULTISIG_ECDSA: 0xa9,
  OP_BLAKE2B: 0xaa,
  OP_CHECKSIG_ECDSA: 0xab,
  OP_CHECKSIG: 0xac,
  OP_CHECKSIGVERIFY: 0xad,
  OP_CHECKMULTISIG: 0xae,
  OP_CHECKMULTISIGVERIFY: 0xaf,
  OP_CHECKLOCKTIMEVERIFY: 0xb0,
  OP_CHECKSEQUENCEVERIFY: 0xb1,
  OP_SMALLINTEGER: 0xfa,
  OP_PUBKEYS: 0xfb,
  OP_PUBKEYHASH: 0xfd,
  OP_PUBKEY: 0xfe,
  OP_INVALIDOPCODE: 0xff,
});

const OP_NAMES = Object.freeze(
  Object.fromEntries(Object.entries(OP).map(([name, code]) => [code, name])),
);

export const MAX_SCRIPT_ELEMENT_SIZE = 520;
export const MAX_SCRIPT_SIZE = 10_000;

export const Script = P.wrap({
  encodeStream: (w, script) => {
    if (!Array.isArray(script))
      throw new Error('Script encoder expects an array of operations');
    let total = 0;
    for (const op of script) {
      if (typeof op === 'string') {
        const opcode = OP[op];
        if (opcode === undefined) throw new Error(`Unknown opcode ${op}`);
        w.byte(opcode);
        total += 1;
        continue;
      }
      if (!isBytes(op)) throw new Error(`Unsupported script element: ${typeof op}`);
      const length = op.length;
      if (length > MAX_SCRIPT_ELEMENT_SIZE) throw new Error(`Push size ${length} exceeds limit ${MAX_SCRIPT_ELEMENT_SIZE}`);
      if (length <= 75) {
        w.byte(length);
        w.bytes(op);
        total += 1 + length;
      } else if (length <= 0xff) {
        w.byte(OP.OP_PUSHDATA1);
        w.byte(length);
        w.bytes(op);
        total += 2 + length;
      } else if (length <= 0xffff) {
        w.byte(OP.OP_PUSHDATA2);
        w.bytes(Uint8Array.of(length & 0xff, (length >>> 8) & 0xff));
        w.bytes(op);
        total += 3 + length;
      } else if (length <= 0xffffffff) {
        w.byte(OP.OP_PUSHDATA4);
        const len = Uint8Array.of(
          length & 0xff,
          (length >>> 8) & 0xff,
          (length >>> 16) & 0xff,
          (length >>> 24) & 0xff,
        );
        w.bytes(len);
        w.bytes(op);
        total += 5 + length;
      } else {
        throw new Error('Push size too large');
      }
    }
    if (total > MAX_SCRIPT_SIZE)
      throw new Error(`Script length ${total} exceeds limit ${MAX_SCRIPT_SIZE}`);
  },
  decodeStream: (r) => {
    const out = [];
    while (!r.isEnd()) {
      const opcode = r.byte();
      if (opcode <= 75) {
        out.push(r.bytes(opcode));
        continue;
      }
      if (opcode === OP.OP_PUSHDATA1) {
        const length = r.byte();
        out.push(r.bytes(length));
        continue;
      }
      if (opcode === OP.OP_PUSHDATA2) {
        const length = r.byte() | (r.byte() << 8);
        out.push(r.bytes(length));
        continue;
      }
      if (opcode === OP.OP_PUSHDATA4) {
        const length = r.byte()
          | (r.byte() << 8)
          | (r.byte() << 16)
          | (r.byte() << 24);
        out.push(r.bytes(length));
        continue;
      }
      const op = OP_NAMES[opcode];
      if (op === undefined) throw new Error(`Unknown opcode 0x${opcode.toString(16)}`);
      out.push(op);
    }
    return out;
  },
});
