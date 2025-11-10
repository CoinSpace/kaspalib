import {
  MASS_PER_STANDARD_INPUT,
  MASS_PER_STANDARD_OUTPUT,
  MASS_PER_STANDARD_TRANSACTION,
  MAXIMUM_STANDARD_TRANSACTION_MASS,
  MAX_SOMPI,
  transactionComputeMass,
  transactionMass,
} from './mass.js';

/**
 * @typedef {import('./kaspa.js').TransactionInput} TransactionInput
 * @typedef {import('./kaspa.js').TransactionOutput} TransactionOutput
 */

/**
 * @typedef {object} UtxoSelectionResult
 * @property {TransactionInput[]|undefined} selected - Inputs picked for the transaction.
 * @property {bigint} fee - Absolute fee paid by the selection.
 * @property {bigint} waste - Fee overhead.
 * @property {bigint} change - Change amount.
 */

export const HARD_DUST = 600n;
export const SOFT_DUST = 2_000_000n;

/**
 * Deterministically sorts candidate inputs by a utxo field with txid/index tie-breakers.
 * @param {TransactionInput[]} utxos - Candidate inputs.
 * @param {string} [sort] - Nested utxo field to compare.
 * @param {boolean} [ascending] - Sort order for the main key.
 * @returns {TransactionInput[]} New sorted array.
 */
export function sortUtxos(utxos, sort = 'daaScore', ascending = true) {
  const direction = ascending ? 1 : -1;
  return utxos.toSorted((a, b) => {
    return a.utxo[sort] === b.utxo[sort] ? 0 : a.utxo[sort] > b.utxo[sort] ? direction : -direction
    || a.utxo.transactionId.localeCompare(a.utxo.transactionId)
    || a.utxo.index - a.utxo.index;
  });
}

/**
 * Estimates the maximum number of standard inputs that can coexist with the provided outputs.
 * @param {TransactionOutput[]} outputs - Desired transaction outputs.
 * @returns {number} Maximum input count inferred from the mass budget.
 */
export function estimateMaxInputsPerTx(outputs) {
  return Number((MAXIMUM_STANDARD_TRANSACTION_MASS
    - MASS_PER_STANDARD_TRANSACTION
    - BigInt(outputs.length) * MASS_PER_STANDARD_OUTPUT) / MASS_PER_STANDARD_INPUT);
}

/**
 * Greedy accumulative selector that keeps adding inputs until the target plus fees is satisfied.
 * @param {TransactionInput[]} utxos - Ordered inputs to consume.
 * @param {TransactionOutput[]} outputs - Desired transaction outputs.
 * @param {object} [options] - Optional tuning parameters.
 * @param {bigint} [options.feerate] - Fee rate in sompis per mass unit.
 * @returns {UtxoSelectionResult} Best selection found, including change when applicable.
 */
export function accumulative(utxos, outputs, { feerate = 1n } = {}) {
  const MAX_INPUTS_PER_TX = estimateMaxInputsPerTx(outputs);
  const target = outputs.reduce((accum, output) => accum += output.amount, 0n);
  const best = {
    selected: undefined,
    change: 0n,
    fee: MAX_SOMPI,
    waste: MAX_SOMPI,
  };
  const inputs = [];
  for (const utxo of utxos) {
    inputs.push(utxo);
    if (inputs.length > MAX_INPUTS_PER_TX) break;
    const total = inputs.reduce((accum, input) => accum += input.utxo.amount, 0n);
    const minFeeNoChange = feerate * transactionComputeMass({
      inputs,
      outputs,
    });
    if (total < target + minFeeNoChange) continue;

    const massNoChange = transactionMass({
      inputs,
      outputs,
    });
    if (massNoChange <= MAXIMUM_STANDARD_TRANSACTION_MASS) {
      const requiredFee = massNoChange * feerate;
      if (requiredFee <= total - target) {
        const fee = total - target;
        const waste = fee - requiredFee;
        if (fee <= best.fee && waste < best.waste) {
          Object.assign(best, {
            selected: inputs.slice(),
            change: 0n,
            fee,
            waste,
          });
        }
      }
    }

    const minFeeWithChange = feerate * transactionComputeMass({
      inputs,
      outputs: [...outputs, { }],
    });
    if (total < target + minFeeWithChange + HARD_DUST) continue;
    // rest may be less than dust due to maximum fee
    const rest = total - target - feerate * MAXIMUM_STANDARD_TRANSACTION_MASS;
    let change = rest > HARD_DUST ? rest : HARD_DUST;
    for (let i = 0; i < 16; i++) {
      const massWithChange = transactionMass({
        inputs,
        outputs: [...outputs, { amount: change }],
      });
      if (massWithChange <= MAXIMUM_STANDARD_TRANSACTION_MASS) {
        const requiredFee = massWithChange * feerate;
        if (requiredFee <= total - target - change) {
          const fee = total - target - change;
          const wasteFee = fee - requiredFee;
          const wasteChange = feerate * (MASS_PER_STANDARD_OUTPUT + MASS_PER_STANDARD_INPUT);
          const waste = wasteFee + wasteChange;
          if (fee <= best.fee && waste < best.waste) {
            Object.assign(best, {
              selected: inputs.slice(),
              change,
              fee,
              waste,
            });
          }
          if (wasteFee === 0n) break;
          // increasing the change can reduce the transaction mass
          change = change + wasteFee;
        }
      } else {
        break;
      }
    }
  }
  return best;
}

/**
 * Depth-first branch and bound search that explores all combinations within the mass window.
 * @param {TransactionInput[]} utxos - Candidate inputs (preferably pre-sorted).
 * @param {TransactionOutput[]} outputs - Desired transaction outputs.
 * @param {object} [options] - Optional tuning parameters.
 * @param {bigint} [options.feerate] - Fee rate in sompis per mass unit.
 * @param {number} [options.maxTries] - Maximum DFS attempts before aborting.
 * @param {bigint} [options.maxWaste] - Acceptable waste threshold to stop early.
 * @returns {UtxoSelectionResult} Exact match if found, otherwise the best effort candidate.
 */
export function branchAndBound(utxos, outputs, { feerate = 1n, maxTries = 2_000_000, maxWaste = HARD_DUST } = {}) {
  const MAX_INPUTS_PER_TX = estimateMaxInputsPerTx(outputs);
  const target = outputs.reduce((accum, output) => accum += output.amount, 0n);
  const targetMin = target + feerate * transactionComputeMass({ inputs: [], outputs });
  const targetMax = target + feerate * transactionComputeMass({
    inputs: new Array(MAX_INPUTS_PER_TX).fill({}),
    outputs,
  });

  const effective = new Map();
  for (const item of utxos) {
    effective.set(item, item.utxo.amount - MASS_PER_STANDARD_INPUT * feerate);
  }

  const remaining = new Array(utxos.length + 1).fill(0n);
  for (let i = utxos.length - 1; i >= 0; i--) {
    remaining[i] = remaining[i + 1] + effective.get(utxos[i]);
  }

  let tries = 0;
  let bestSum = MAX_SOMPI;
  const best = {
    selected: undefined,
    fee: MAX_SOMPI,
    waste: MAX_SOMPI,
  };
  const inputs = [];

  // eslint-disable-next-line jsdoc/require-jsdoc
  function dfs(idx, sum) {
    if (tries++ > maxTries) return false;
    if (inputs.length > MAX_INPUTS_PER_TX) return false;
    if (sum > targetMax || sum >= bestSum) return false;
    if (sum + remaining[idx] < targetMin) return false;
    if (sum >= targetMin && sum <= targetMax) {
      const mass = transactionMass({
        inputs,
        outputs,
      });
      if (mass > MAXIMUM_STANDARD_TRANSACTION_MASS) return false;
      const total = inputs.reduce((accum, input) => accum += input.utxo.amount, 0n);
      const fee = total - target;
      if (total - target >= feerate * mass && fee < best.fee) {
        const waste = fee - feerate * mass;
        Object.assign(best, {
          selected: inputs.slice(),
          fee,
          waste,
          tries,
        });
        bestSum = sum;
        if (waste <= maxWaste) return true;
      }
    }
    if (idx >= utxos.length) return false;

    inputs.push(utxos[idx]);
    if (dfs(idx + 1, sum + effective.get(utxos[idx]))) return true;
    inputs.pop();

    if (dfs(idx + 1, sum)) return true;
    return false;
  }

  dfs(0, 0n);

  return best;
}

/**
 * Runs multiple selection strategies and sort orders, returning the lowest-fee solution.
 * @param {TransactionInput[]} utxos - Unspent coins to choose from.
 * @param {TransactionOutput[]} outputs - Requested outputs.
 * @param {object} [options] - Optional tuning parameters.
 * @param {bigint} [options.maxWaste] - Acceptable waste threshold before early exit.
 * @param {bigint} [options.feerate] - Fee rate in sompis per mass unit for all strategies.
 * @param {bigint} [options.maxFee] - Absolute fee cap that, when exceeded, raises an error.
 * @returns {UtxoSelectionResult} Selection result shared by all strategies.
 * @throws {Error} When no valid selection fits the `maxFee` budget.
 */
export function select(utxos, outputs, options = {}) {
  const {
    maxWaste = HARD_DUST,
    feerate = 1n,
    maxFee = 10n * feerate * MAXIMUM_STANDARD_TRANSACTION_MASS,
  } = options;
  const best = {
    selected: undefined,
    fee: MAX_SOMPI,
    waste: MAX_SOMPI,
  };
  for (const alg of [branchAndBound, accumulative]) {
    for (const sortedUtxos of [
      sortUtxos(utxos, 'daaScore'),
      sortUtxos(utxos, 'amount', false),
      sortUtxos(utxos, 'amount', true)]) {
      const { fee, waste, selected } = alg(sortedUtxos, outputs, options);
      if (fee <= best.fee && waste < best.waste) {
        Object.assign(best, {
          selected,
          fee,
          waste,
        });
        if (waste <= maxWaste) break;
      }
    }
  }
  if (best.fee > maxFee) {
    const i = utxos.map((u) => `${u.utxo.transactionId}#${u.utxo.index}`).join(',');
    const o = outputs.map((o) => o.amount).join(',');
    throw new Error(`Impossible to select ${o} from utxos ${i} with feerate ${feerate}`);
  }
  return best;
}
