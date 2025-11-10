/* eslint-disable jsdoc/require-jsdoc */
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { bytesToNumberBE } from '@noble/curves/utils.js';
import { randomBytes } from '@noble/hashes/utils.js';

import {
  MASS_PER_STANDARD_OUTPUT,
  MAXIMUM_STANDARD_TRANSACTION_MASS,
  SOMPI_PER_KASPA,
  transactionMass,
} from '../lib/mass.js';
import {
  SOFT_DUST,
  accumulative,
  branchAndBound,
  select,
  sortUtxos,
} from '../lib/utxo.js';

import raw from './fixtures/utxos.json' with { type: 'json' };

const utxos = raw.map((item) => {
  return {
    utxo: {
      transactionId: item.outpoint.transactionId,
      index: parseInt(item.outpoint.index),
      amount: BigInt(item.utxoEntry.amount),
      daaScore: parseInt(item.utxoEntry.blockDaaScore),
    },
  };
});

function computeMaxSendableAmount(utxos, feerate = 1n) {
  const inputs = sortUtxos(utxos, 'amount', false).slice(0, 88);
  const total = inputs.reduce((accum, input) => accum += input.utxo.amount, 0n);
  let max = total - MAXIMUM_STANDARD_TRANSACTION_MASS * feerate;
  for (let i = 0; i < 16; i++) {
    const mass = transactionMass({
      inputs,
      outputs: [{ amount: max }],
    });
    const requiredFee = mass * feerate;
    if (requiredFee === total - max) break;
    max = total - requiredFee;
  }
  return max;
}

describe('utxo', () => {
  const max = computeMaxSendableAmount(utxos);

  describe('accumulative', () => {
    test('output 1 KAS, sort by daaScore', () => {
      const res = accumulative(sortUtxos(utxos), [{
        amount: 1n * SOMPI_PER_KASPA,
      }]);
      assert(res.selected);
    });

    test('output 0.02 KAS, sort by daaScore', () => {
      const res = accumulative(sortUtxos(utxos), [{
        amount: SOFT_DUST,
      }]);
      assert(res.selected);
    });

    test('output 1 KAS, sort by amount ascending', () => {
      const res = accumulative(sortUtxos(utxos, 'amount'), [{
        amount: 1n * SOMPI_PER_KASPA,
      }]);
      assert(res.selected);
    });

    test('output 0.02 KAS, sort by amount ascending', () => {
      const res = accumulative(sortUtxos(utxos, 'amount'), [{
        amount: SOFT_DUST,
      }]);
      assert(res.selected);
    });

    test('output 1 KAS, sort by amount descending', () => {
      const res = accumulative(sortUtxos(utxos, 'amount', false), [{
        amount: 1n * SOMPI_PER_KASPA,
      }]);
      assert(res.selected);
    });

    test('output 0.02 KAS, sort by amount descending', () => {
      const res = accumulative(sortUtxos(utxos, 'amount', false), [{
        amount: SOFT_DUST,
      }]);
      assert(!res.selected);
    });

    test('output max KAS, sort by amount descending', () => {
      const res = accumulative(sortUtxos(utxos, 'amount', false), [{
        amount: max,
      }]);
      assert(res.selected);
    });
  });

  describe('branchAndBound', () => {
    test('output 1 KAS, sort by daaScore', () => {
      const res = branchAndBound(sortUtxos(utxos), [{
        amount: 1n * SOMPI_PER_KASPA,
      }]);
      assert(res.selected);
    });

    test('output 0.02 KAS, sort by daaScore', () => {
      const res = branchAndBound(sortUtxos(utxos), [{
        amount: SOFT_DUST,
      }]);
      assert(res.selected);
    });

    test('output max KAS, sort by amount descending', () => {
      const res = branchAndBound(sortUtxos(utxos, 'amount', false), [{
        amount: max,
      }]);
      assert(res.selected);
    });
  });

  describe('select', () => {
    test('output 1 KAS', () => {
      const res = select(utxos, [{
        amount: 1n * SOMPI_PER_KASPA,
      }]);
      assert(res.selected);
    });

    test('output 0.02 KAS', () => {
      const res = select(utxos, [{
        amount: SOFT_DUST,
      }]);
      assert(res.selected);
    });

    test('output 0.01 KAS', () => {
      const res = select(utxos, [{
        amount: SOFT_DUST / 2n,
      }]);
      assert(res.selected);
    });

    test('output max KAS', () => {
      const res = select(utxos, [{
        amount: max,
      }]);
      assert(res.selected);
    });

    test('single output in range', () => {
      const step = max / 10n;
      for (let amount = step; amount <= max; amount += step) {
        const res = select(utxos, [{
          amount,
        }]);
        assert(res.selected);
      }
    });

    test('two outputs in range', () => {
      const step = (max - MASS_PER_STANDARD_OUTPUT) / 10n;
      for (let amount = step; amount <= max; amount += step) {
        const res = select(utxos, [{
          amount: amount / 10n * 9n,
        }, {
          amount: amount / 10n,
        }]);
        assert(res.selected);
      }
    });

    test('single random output', () => {
      for (let i = 0; i < 10; i ++) {
        const amount = bytesToNumberBE(randomBytes(max.toString(2).length)) % max + SOFT_DUST;
        const res = select(utxos, [{
          amount,
        }]);
        assert(res.selected);
      }
    });

    test('two random outputs', () => {
      for (let i = 0; i < 10; i ++) {
        const amount = bytesToNumberBE(randomBytes(max.toString(2).length)) % max + SOFT_DUST * 10n;
        const res = select(utxos, [{
          amount: amount / 10n * 9n,
        }, {
          amount: amount / 10n,
        }]);
        assert(res.selected);
      }
    });

    test('throws when best selection exceeds max fee budget', () => {
      assert.throws(() => {
        select(utxos, [{
          amount: 1n * SOMPI_PER_KASPA,
        }], {
          maxFee: 9_999n,
        });
      }, /Impossible to select/);
    });
  });
});
