/* eslint-disable max-len */
import assert from 'node:assert';
import { describe, test } from 'node:test';

import {
  SOMPI_PER_KASPA,
  STORAGE_MASS_PARAMETER,
  UTXO_CONST_STORAGE,
  UTXO_UNIT_SIZE,
  inputSize,
  outputSize,
  transactionComputeMass,
  transactionSize,
  transactionStorageMass,
  utxoPlurality,
} from 'kaspalib';

const makeScript = (len) => ({ length: len });

const generateTxFromAmounts = (inputs, outputs, scriptLen = 0) => ({
  inputs: inputs.map((amount) => ({
    utxo: { amount: BigInt(amount), script: makeScript(scriptLen) },
    sigOpCount: 0,
  })),
  outputs: outputs.map((amount) => ({ amount: BigInt(amount), script: makeScript(scriptLen) })),
});

const scriptForPlurality = (desiredPlurality) => {
  const length = Number((desiredPlurality - 1n) * UTXO_UNIT_SIZE);
  return makeScript(length);
};

describe('input/output/tx default sizes', () => {
  test('default input size', () => {
    assert.strictEqual(inputSize({}), 118n);
  });

  test('default output size', () => {
    assert.strictEqual(outputSize({}), 52n);
  });

  test('empty tx size', () => {
    assert.strictEqual(transactionSize({}), 94n);
  });

  test('1:1 tx size', () => {
    // 94 + 118 + 52
    assert.strictEqual(transactionSize({ inputs: [{}], outputs: [{}] }), 264n);
  });

  test('empty tx mass', () => {
    assert.strictEqual(transactionComputeMass({}), 94n);
  });

  test('1:1 tx mass', () => {
    // 94 + 1000 + 118 + 360 + 52
    assert.strictEqual(transactionComputeMass({ inputs: [{}], outputs: [{}] }), 1624n);
  });
});

describe('utxoPlurality', () => {
  test('returns 1 for default and empty scripts', () => {
    assert.strictEqual(utxoPlurality({}), 1n);
    assert.strictEqual(utxoPlurality({ script: makeScript(0) }), 1n);
  });

  test('returns 1 when script length equals the threshold', () => {
    const threshold = Number(UTXO_UNIT_SIZE - UTXO_CONST_STORAGE);
    assert.strictEqual(utxoPlurality({ script: makeScript(threshold) }), 1n);
  });

  test('returns > 1 only when script length exceeds the threshold', () => {
    const threshold = Number(UTXO_UNIT_SIZE - UTXO_CONST_STORAGE);
    assert.strictEqual(utxoPlurality({ script: makeScript(threshold + 1) }), 2n);
  });
});

describe('transactionStorageMass (plurality parity with Rust)', () => {
  const cases = [
    {
      name: '3:4; input index=1, plurality=2',
      inputsTx1: [300n, 200n, 200n],
      outputsTx1: [200n, 200n, 200n, 100n],
      inputsTx2: [300n, 400n],
      outputsTx2: [200n, 200n, 200n, 100n],
      pluralityIndex: 1,
      desiredPlurality: 2n,
      overrideOutput: false,
      storageMassParameter: STORAGE_MASS_PARAMETER,
    },
    {
      name: '2:3; output index=1, plurality=2',
      inputsTx1: [350n, 400n],
      outputsTx1: [300n, 200n, 200n],
      inputsTx2: [350n, 400n],
      outputsTx2: [300n, 400n],
      pluralityIndex: 1,
      desiredPlurality: 2n,
      overrideOutput: true,
      storageMassParameter: STORAGE_MASS_PARAMETER,
    },
    {
      name: '1:2; output index=0, plurality=2',
      inputsTx1: [500n],
      outputsTx1: [200n, 200n],
      inputsTx2: [500n],
      outputsTx2: [400n],
      pluralityIndex: 0,
      desiredPlurality: 2n,
      overrideOutput: true,
      storageMassParameter: STORAGE_MASS_PARAMETER,
    },
    {
      name: '1:3; output index=1, plurality=2',
      inputsTx1: [1000n],
      outputsTx1: [200n, 200n, 200n],
      inputsTx2: [1000n],
      outputsTx2: [200n, 400n],
      pluralityIndex: 1,
      desiredPlurality: 2n,
      overrideOutput: true,
      storageMassParameter: STORAGE_MASS_PARAMETER,
    },
    {
      name: '1:3; output index=1, plurality=2; kas units',
      inputsTx1: [1000n * SOMPI_PER_KASPA],
      outputsTx1: [200n * SOMPI_PER_KASPA, 200n * SOMPI_PER_KASPA, 200n * SOMPI_PER_KASPA],
      inputsTx2: [1000n * SOMPI_PER_KASPA],
      outputsTx2: [200n * SOMPI_PER_KASPA, 400n * SOMPI_PER_KASPA],
      pluralityIndex: 1,
      desiredPlurality: 2n,
      overrideOutput: true,
      storageMassParameter: STORAGE_MASS_PARAMETER,
    },
    {
      name: '1:2; output index=0, plurality=2; kas units',
      inputsTx1: [1000n * SOMPI_PER_KASPA],
      outputsTx1: [200n * SOMPI_PER_KASPA, 200n * SOMPI_PER_KASPA],
      inputsTx2: [1000n * SOMPI_PER_KASPA],
      outputsTx2: [400n * SOMPI_PER_KASPA],
      pluralityIndex: 0,
      desiredPlurality: 2n,
      overrideOutput: true,
      storageMassParameter: STORAGE_MASS_PARAMETER,
    },
    {
      name: '2:2; output index=0, plurality=2; kas units',
      inputsTx1: [350n * SOMPI_PER_KASPA, 500n * SOMPI_PER_KASPA],
      outputsTx1: [200n * SOMPI_PER_KASPA, 200n * SOMPI_PER_KASPA],
      inputsTx2: [350n * SOMPI_PER_KASPA, 500n * SOMPI_PER_KASPA],
      outputsTx2: [400n * SOMPI_PER_KASPA],
      pluralityIndex: 0,
      desiredPlurality: 2n,
      overrideOutput: true,
      storageMassParameter: STORAGE_MASS_PARAMETER,
    },
    {
      name: '4:6; output index=3, plurality=3; kas units',
      inputsTx1: [350n * SOMPI_PER_KASPA, 500n * SOMPI_PER_KASPA, 350n * SOMPI_PER_KASPA, 500n * SOMPI_PER_KASPA],
      outputsTx1: [
        200n * SOMPI_PER_KASPA,
        200n * SOMPI_PER_KASPA,
        400n * SOMPI_PER_KASPA,
        250n * SOMPI_PER_KASPA,
        250n * SOMPI_PER_KASPA,
        250n * SOMPI_PER_KASPA,
      ],
      inputsTx2: [350n * SOMPI_PER_KASPA, 500n * SOMPI_PER_KASPA, 350n * SOMPI_PER_KASPA, 500n * SOMPI_PER_KASPA],
      outputsTx2: [200n * SOMPI_PER_KASPA, 200n * SOMPI_PER_KASPA, 400n * SOMPI_PER_KASPA, 750n * SOMPI_PER_KASPA],
      pluralityIndex: 3,
      desiredPlurality: 3n,
      overrideOutput: true,
      storageMassParameter: STORAGE_MASS_PARAMETER,
    },
  ];

  cases.forEach((tc) => {
    test(tc.name, () => {
      const sum = (arr) => arr.reduce((acc, v) => acc + v, 0n);
      assert.ok(sum(tc.inputsTx1) >= sum(tc.outputsTx1), `${tc.name}: tx1 outs > ins`);
      assert.ok(sum(tc.inputsTx2) >= sum(tc.outputsTx2), `${tc.name}: tx2 outs > ins`);

      const tx1 = generateTxFromAmounts(tc.inputsTx1, tc.outputsTx1);
      const tx2 = generateTxFromAmounts(tc.inputsTx2, tc.outputsTx2);
      const mass1 = transactionStorageMass(tx1, { storageMassParameter: tc.storageMassParameter });

      if (tc.pluralityIndex !== undefined) {
        const target = tc.overrideOutput
          ? tx2.outputs[tc.pluralityIndex]
          : tx2.inputs[tc.pluralityIndex].utxo;
        target.script = scriptForPlurality(tc.desiredPlurality);
      }

      const mass2 = transactionStorageMass(tx2, { storageMassParameter: tc.storageMassParameter });
      assert.notStrictEqual(mass1, 0n, `${tc.name}: avoid running meaningless test cases`);
      assert.strictEqual(
        mass1,
        mass2,
        `${tc.name}: mass mismatch tx1=${mass1.toString()} tx2=${mass2.toString()}`
      );
    });
  });
});

describe('transactionStorageMass', () => {
  test('tx with less outs than ins (1)', () => {
    const tx = generateTxFromAmounts([100n, 200n, 300n], [300n, 300n]);
    assert.strictEqual(transactionStorageMass(tx), 0n);
  });

  test('tx with less outs than ins (2)', () => {
    const tx = generateTxFromAmounts([100n, 200n, 300n], [50n, 550n]);
    const expected = STORAGE_MASS_PARAMETER / 50n + STORAGE_MASS_PARAMETER / 550n - 3n * (STORAGE_MASS_PARAMETER / 200n);
    assert.strictEqual(transactionStorageMass(tx), expected);
  });

  test('tx with more outs than ins (1)', () => {
    const base = 10_000n * SOMPI_PER_KASPA;
    const tx = generateTxFromAmounts([base, base, base * 2n], [base, base, base, base]);
    assert.strictEqual(transactionStorageMass(tx), 4n);
  });

  test('tx with more outs than ins (2)', () => {
    const base = 10_000n * SOMPI_PER_KASPA;
    const tx = generateTxFromAmounts([base, base, base * 2n], [10n * SOMPI_PER_KASPA, base, base, base]);
    assert.strictEqual(transactionStorageMass(tx), 1003n);
  });

  test('tx with more outs than ins (3)', () => {
    const base = 10_000n * SOMPI_PER_KASPA;
    const tx = generateTxFromAmounts([base + 4n, base, base * 2n], [base + 1n, base + 1n, base + 1n, base + 1n]);
    assert.strictEqual(transactionStorageMass(tx), 0n);
  });

  test('2:2 transaction', () => {
    const tx = generateTxFromAmounts([100n, 200n], [50n, 250n]);
    assert.strictEqual(transactionStorageMass(tx), 9_000_000_000n);
  });

  test('outputs equal to inputs', () => {
    const tx = generateTxFromAmounts([100n, 200n], [100n, 200n]);
    assert.strictEqual(transactionStorageMass(tx), 0n);
  });

  test('2:1 transaction', () => {
    const tx = generateTxFromAmounts([100n, 200n], [50n]);
    assert.strictEqual(transactionStorageMass(tx), 5_000_000_000n);
  });
});
