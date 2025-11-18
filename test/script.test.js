/* eslint-disable max-len */
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  MAX_SCRIPT_ELEMENT_SIZE,
  MAX_SCRIPT_SIZE,
  OP,
  Script,
} from 'kaspalib';

describe('Script.encode opcodes', () => {
  const TESTS = [
    { name: 'push OP_0', ops: ['OP_0'], expected: Uint8Array.of(OP.OP_0) },
    { name: 'push OP_1', ops: ['OP_1'], expected: Uint8Array.of(OP.OP_1) },
    { name: 'push OP_1 OP_2', ops: ['OP_1', 'OP_2'], expected: Uint8Array.of(OP.OP_1, OP.OP_2) },
    { name: 'push OP_BLAKE2B OP_EQUAL', ops: ['OP_BLAKE2B', 'OP_EQUAL'], expected: Uint8Array.of(OP.OP_BLAKE2B, OP.OP_EQUAL) },
  ];

  for (const { name, ops, expected } of TESTS) {
    test(name, () => {
      assert.deepEqual(Script.encode(ops), expected);
    });
  }
});

describe('Script.encode integers', () => {
  const TESTS = [
    { name: '-1', ops: ['OP_1NEGATE'], expected: Uint8Array.of(OP.OP_1NEGATE) },
    { name: 'small 0', ops: ['OP_0'], expected: Uint8Array.of(OP.OP_0) },
    { name: 'small 1', ops: ['OP_1'], expected: Uint8Array.of(OP.OP_1) },
    { name: 'small 2', ops: ['OP_2'], expected: Uint8Array.of(OP.OP_2) },
    { name: 'small 3', ops: ['OP_3'], expected: Uint8Array.of(OP.OP_3) },
    { name: 'small 4', ops: ['OP_4'], expected: Uint8Array.of(OP.OP_4) },
    { name: 'small 5', ops: ['OP_5'], expected: Uint8Array.of(OP.OP_5) },
    { name: 'small 6', ops: ['OP_6'], expected: Uint8Array.of(OP.OP_6) },
    { name: 'small 7', ops: ['OP_7'], expected: Uint8Array.of(OP.OP_7) },
    { name: 'small 8', ops: ['OP_8'], expected: Uint8Array.of(OP.OP_8) },
    { name: 'small 9', ops: ['OP_9'], expected: Uint8Array.of(OP.OP_9) },
    { name: 'small 10', ops: ['OP_10'], expected: Uint8Array.of(OP.OP_10) },
    { name: 'small 11', ops: ['OP_11'], expected: Uint8Array.of(OP.OP_11) },
    { name: 'small 12', ops: ['OP_12'], expected: Uint8Array.of(OP.OP_12) },
    { name: 'small 13', ops: ['OP_13'], expected: Uint8Array.of(OP.OP_13) },
    { name: 'small 14', ops: ['OP_14'], expected: Uint8Array.of(OP.OP_14) },
    { name: 'small 15', ops: ['OP_15'], expected: Uint8Array.of(OP.OP_15) },
    { name: 'small 16', ops: ['OP_16'], expected: Uint8Array.of(OP.OP_16) },
    { name: '17', ops: [Uint8Array.of(0x11)], expected: Uint8Array.of(0x01, 0x11) },
    { name: '65', ops: [Uint8Array.of(0x41)], expected: Uint8Array.of(0x01, 0x41) },
    { name: '127', ops: [Uint8Array.of(0x7f)], expected: Uint8Array.of(0x01, 0x7f) },
    { name: '128', ops: [Uint8Array.of(0x80, 0x00)], expected: Uint8Array.of(0x02, 0x80, 0x00) },
    { name: '255', ops: [Uint8Array.of(0xff, 0x00)], expected: Uint8Array.of(0x02, 0xff, 0x00) },
    { name: '256', ops: [Uint8Array.of(0x00, 0x01)], expected: Uint8Array.of(0x02, 0x00, 0x01) },
    { name: '32767', ops: [Uint8Array.of(0xff, 0x7f)], expected: Uint8Array.of(0x02, 0xff, 0x7f) },
    { name: '32768', ops: [Uint8Array.of(0x00, 0x80, 0x00)], expected: Uint8Array.of(0x03, 0x00, 0x80, 0x00) },
    { name: '-2', ops: [Uint8Array.of(0x82)], expected: Uint8Array.of(0x01, 0x82) },
    { name: '-3', ops: [Uint8Array.of(0x83)], expected: Uint8Array.of(0x01, 0x83) },
    { name: '-4', ops: [Uint8Array.of(0x84)], expected: Uint8Array.of(0x01, 0x84) },
    { name: '-5', ops: [Uint8Array.of(0x85)], expected: Uint8Array.of(0x01, 0x85) },
    { name: '-17', ops: [Uint8Array.of(0x91)], expected: Uint8Array.of(0x01, 0x91) },
    { name: '-65', ops: [Uint8Array.of(0xc1)], expected: Uint8Array.of(0x01, 0xc1) },
    { name: '-127', ops: [Uint8Array.of(0xff)], expected: Uint8Array.of(0x01, 0xff) },
    { name: '-128', ops: [Uint8Array.of(0x80, 0x80)], expected: Uint8Array.of(0x02, 0x80, 0x80) },
    { name: '-255', ops: [Uint8Array.of(0xff, 0x80)], expected: Uint8Array.of(0x02, 0xff, 0x80) },
    { name: '-256', ops: [Uint8Array.of(0x00, 0x81)], expected: Uint8Array.of(0x02, 0x00, 0x81) },
    { name: '-32767', ops: [Uint8Array.of(0xff, 0xff)], expected: Uint8Array.of(0x02, 0xff, 0xff) },
    { name: '-32768', ops: [Uint8Array.of(0x00, 0x80, 0x80)], expected: Uint8Array.of(0x03, 0x00, 0x80, 0x80) },
    {
      name: '9223372036854775807',
      ops: [Uint8Array.of(0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x7f)],
      expected: Uint8Array.of(0x08, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x7f),
    },
    {
      name: '-9223372036854775808',
      ops: [Uint8Array.of(0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80)],
      expected: Uint8Array.of(0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80),
    },
  ];

  for (const { name, ops, expected } of TESTS) {
    test(name, () => {
      assert.deepEqual(Script.encode(ops), expected);
    });
  }
});

describe('Script.encode data pushes', () => {
  const fill = (len) => new Uint8Array(len).fill(0x49);

  const TESTS = [
    { name: 'empty', ops: ['OP_0'], expected: Uint8Array.of(OP.OP_0) },
    { name: 'push 1 byte 0x01', ops: ['OP_1'], expected: Uint8Array.of(OP.OP_1) },
    { name: 'push 1 byte 0x02', ops: ['OP_2'], expected: Uint8Array.of(OP.OP_2) },
    { name: 'push 1 byte 0x81', ops: ['OP_1NEGATE'], expected: Uint8Array.of(OP.OP_1NEGATE) },
    { name: 'push 1 byte 0x11', ops: [Uint8Array.of(0x11)], expected: Uint8Array.of(0x01, 0x11) },
    { name: 'push data len 17', ops: [fill(17)], expected: Uint8Array.of(17, ...fill(17)) },
    { name: 'push data len 75', ops: [fill(75)], expected: Uint8Array.of(75, ...fill(75)) },
    {
      name: 'push data len 76',
      ops: [fill(76)],
      expected: Uint8Array.of(OP.OP_PUSHDATA1, 76, ...fill(76)),
    },
    {
      name: 'push data len 255',
      ops: [fill(255)],
      expected: Uint8Array.of(OP.OP_PUSHDATA1, 255, ...fill(255)),
    },
    {
      name: 'push data len 256',
      ops: [fill(256)],
      expected: Uint8Array.of(OP.OP_PUSHDATA2, 0x00, 0x01, ...fill(256)),
    },
    {
      name: 'push data len 520',
      ops: [fill(520)],
      expected: Uint8Array.of(OP.OP_PUSHDATA2, 0x08, 0x02, ...fill(520)),
    },
  ];

  for (const { name, ops, expected } of TESTS) {
    test(name, () => {
      assert.deepEqual(Script.encode(ops), expected);
    });
  }

  const ERROR_TESTS = [{ name: 'push data len 521', ops: [fill(MAX_SCRIPT_ELEMENT_SIZE + 1)] }];

  for (const { name, ops } of ERROR_TESTS) {
    test(`${name} fails`, () => {
      assert.throws(() => Script.encode(ops));
    });
  }
});

describe('Script.encode u64 helpers', () => {
  const TESTS = [
    { name: '0x00', ops: ['OP_0'], expected: Uint8Array.of(OP.OP_0) },
    { name: '0x01', ops: ['OP_1'], expected: Uint8Array.of(OP.OP_1) },
    { name: '0xff', ops: [Uint8Array.of(0xff)], expected: Uint8Array.of(0x01, 0xff) },
    { name: '0xffee', ops: [Uint8Array.of(0xee, 0xff)], expected: Uint8Array.of(0x02, 0xee, 0xff) },
    { name: '0xffeedd', ops: [Uint8Array.of(0xdd, 0xee, 0xff)], expected: Uint8Array.of(0x03, 0xdd, 0xee, 0xff) },
    { name: '0xffeeddcc', ops: [Uint8Array.of(0xcc, 0xdd, 0xee, 0xff)], expected: Uint8Array.of(0x04, 0xcc, 0xdd, 0xee, 0xff) },
    { name: '0xffeeddccbb', ops: [Uint8Array.of(0xbb, 0xcc, 0xdd, 0xee, 0xff)], expected: Uint8Array.of(0x05, 0xbb, 0xcc, 0xdd, 0xee, 0xff) },
    { name: '0xffeeddccbbaa', ops: [Uint8Array.of(0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff)], expected: Uint8Array.of(0x06, 0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff) },
    { name: '0xffeeddccbbaa99', ops: [Uint8Array.of(0x99, 0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff)], expected: Uint8Array.of(0x07, 0x99, 0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff) },
    {
      name: '0xffeeddccbbaa9988',
      ops: [Uint8Array.of(0x88, 0x99, 0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff)],
      expected: Uint8Array.of(0x08, 0x88, 0x99, 0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff),
    },
    {
      name: '0xffffffffffffffff',
      ops: [new Uint8Array(8).fill(0xff)],
      expected: Uint8Array.of(0x08, ...new Uint8Array(8).fill(0xff)),
    },
  ];

  for (const { name, ops, expected } of TESTS) {
    test(name, () => {
      assert.deepEqual(Script.encode(ops), expected);
    });
  }
});

describe('Script encode size limits', () => {
  const maxData = new Uint8Array(MAX_SCRIPT_SIZE - 3).fill(0);

  test('exceeding size with extra data', () => {
    assert.throws(() => Script.encode([maxData, Uint8Array.of(0)]));
  });

  test('exceeding size with extra opcode', () => {
    assert.throws(() => Script.encode([maxData, 'OP_CHECKSIG']));
  });

  test('exceeding size with integer', () => {
    assert.throws(() => Script.encode([maxData, Uint8Array.of(0x01)]));
  });
});
