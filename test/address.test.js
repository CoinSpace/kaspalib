import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { Address, ADDRESS_PREFIXES } from 'kaspalib';

const cases = [
  { address: 'a:qqeq69uvrh', prefix: 'a', type: 'pk', payload: new Uint8Array() },
  { address: 'a:pq99546ray', prefix: 'a', type: 'sh', payload: new Uint8Array() },
  { address: 'b:pqsqzsjd64fv', prefix: 'b', type: 'sh', payload: new TextEncoder().encode(' ') },
  { address: 'b:pqksmhczf8ud', prefix: 'b', type: 'sh', payload: new TextEncoder().encode('-') },
  { address: 'b:pqcq53eqrk0e', prefix: 'b', type: 'sh', payload: new TextEncoder().encode('0') },
  { address: 'b:pqcshg75y0vf', prefix: 'b', type: 'sh', payload: new TextEncoder().encode('1') },
  { address: 'b:pqknzl4e9y0zy', prefix: 'b', type: 'sh', payload: new TextEncoder().encode('-1') },
  { address: 'b:pqcnzt888ytdg', prefix: 'b', type: 'sh', payload: new TextEncoder().encode('11') },
  { address: 'b:ppskycc8txxxn2w', prefix: 'b', type: 'sh', payload: new TextEncoder().encode('abc') },
  { address: 'b:pqcnyve5x5unsdekxqeusxeyu2', prefix: 'b', type: 'sh', payload: new TextEncoder().encode('1234598760') },
  {
    address: 'b:ppskycmyv4nxw6rfdf4kcmtwdac8zunnw36hvamc09aqtpppz8lk',
    prefix: 'b',
    type: 'sh',
    payload: new TextEncoder().encode('abcdefghijklmnopqrstuvwxyz'),
  },
  {
    address: 'b:pqcrqvpsxqcrqvpsxqcrqvpsxqcrqvpsxqcrqvpsxqcrqvpsxqcrqvpsxqcrqvpsxqcrq7ag684l3',
    prefix: 'b',
    type: 'sh',
    payload: new TextEncoder().encode('000000000000000000000000000000000000000000'),
  },
  {
    address: 'kaspatest:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqhqrxplya',
    prefix: ADDRESS_PREFIXES.testnet,
    type: 'pk',
    payload: new Uint8Array(32),
  },
  {
    address: 'kaspatest:qyqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqhe837j2d',
    prefix: ADDRESS_PREFIXES.testnet,
    type: 'pk-ecdsa',
    payload: new Uint8Array(33),
  },
  {
    address: 'kaspatest:qxaqrlzlf6wes72en3568khahq66wf27tuhfxn5nytkd8tcep2c0vrse6gdmpks',
    prefix: ADDRESS_PREFIXES.testnet,
    type: 'pk-ecdsa',
    payload: new Uint8Array([
      0xba, 0x01, 0xfc, 0x5f, 0x4e, 0x9d, 0x98, 0x79, 0x59, 0x9c, 0x69, 0xa3, 0xda, 0xfd, 0xb8, 0x35,
      0xa7, 0x25, 0x5e, 0x5f, 0x2e, 0x93, 0x4e, 0x93, 0x22, 0xec, 0xd3, 0xaf, 0x19, 0x0a, 0xb0, 0xf6, 0x0e,
    ]),
  },
  {
    address: 'kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e',
    prefix: ADDRESS_PREFIXES.mainnet,
    type: 'pk',
    payload: new Uint8Array(32),
  },
  {
    address: 'kaspa:qp0l70zd5x85ttwd6jv7g3s3a8llzj96d8dncn4zmhv4tlzx5k2jyqh70xmfj',
    prefix: ADDRESS_PREFIXES.mainnet,
    type: 'pk',
    payload: new Uint8Array([
      0x5f, 0xff, 0x3c, 0x4d, 0xa1, 0x8f, 0x45, 0xad, 0xcd, 0xd4, 0x99, 0xe4, 0x46, 0x11, 0xe9, 0xff,
      0xf1, 0x48, 0xba, 0x69, 0xdb, 0x3c, 0x4e, 0xa2, 0xdd, 0xd9, 0x55, 0xfc, 0x46, 0xa5, 0x95, 0x22,
    ]),
  },
];

describe('Address encode/decode', () => {
  for (const { address: expected, prefix, type, payload } of cases) {
    const address = Address({ prefix });

    test(`encode ${expected}`, () => {
      assert.equal(
        address.encode({ prefix, type, payload }),
        expected
      );
    });

    test(`decode ${expected}`, () => {
      const decoded = address.decode(expected);
      assert.equal(decoded.prefix, prefix);
      assert.equal(decoded.type, type);
      assert.deepEqual(decoded.payload, payload);
    });
  }
});

describe('Address errors', () => {
  const errorCases = [
    'kaspa:qqqqqqqqqqqqq1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e',
    'kaspa:qqqqqqqqqqqqq\x7cqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e',
    'kaspa:qqqqqqqqqqqqq\x81qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e',
    'kaspa1:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e',
    'kaspaqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e',
    'kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4l',
    'kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e',
  ];

  for (const value of errorCases) {
    test(`decode fails for ${value}`, () => {
      assert.throws(() => Address().decode(value));
    });
  }
});
