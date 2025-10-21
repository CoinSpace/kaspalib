export const HASH_SIZE = 32n;
export const SUBNETWORK_ID_SIZE = 20n;
// https://github.com/kaspanet/rusty-kaspa/blob/v1.0.1/wallet/core/src/tx/mass.rs#L16
export const SIGNATURE_SCRIPT_SIZE = 66n; // 1 byte for OP_DATA_65 + 64 (length of signature) + 1 byte for sig hash type
// https://github.com/kaspanet/rusty-kaspa/blob/v1.0.1/consensus/core/src/tx/script_public_key.rs#L24
export const PUBKEY_SCRIPT_SIZE = 34n;

// https://github.com/kaspanet/rusty-kaspa/blob/v1.0.1/consensus/core/src/constants.rs#L13-L16
export const SOMPI_PER_KASPA = 100_000_000n;
export const STORAGE_MASS_PARAMETER = SOMPI_PER_KASPA * 10_000n;
// https://github.com/kaspanet/rusty-kaspa/blob/v1.0.1/consensus/core/src/config/params.rs#L519-L521
export const MASS_PER_TX_BYTE = 1n;
export const MASS_PER_SCRIPT_PUB_KEY_BYTE = 10n;
export const MASS_PER_SIG_OP = 1000n;

const U16_SIZE = 2n;
const U32_SIZE = 4n;
const U64_SIZE = 8n;

// https://github.com/kaspanet/rusty-kaspa/blob/v1.0.1/consensus/core/src/mass/mod.rs#L66-L78
export const UTXO_CONST_STORAGE =
  32n  // outpoint::tx_id
  + 4n // outpoint::index
  + 8n // entry amount
  + 8n // entry DAA score
  + 1n // entry is coinbase
  + 2n // entry spk version
  + 8n; // entry spk len
export const UTXO_UNIT_SIZE = 100n;

// Math.ceil(a / b) for bigint
const ceilDiv = (a, b) => {
  return (a + b - 1n) / b;
}

export function inputSize(input) {
  let size = 0n;
  size += HASH_SIZE; // previous tx ID
  size += U32_SIZE; // index (u32)
  size += U64_SIZE; // length of signature script (u64)
  size += BigInt(input.script?.length ?? SIGNATURE_SCRIPT_SIZE);
  size += U64_SIZE; // sequence (u64)
  return size;
}

export function outputSize(output) {
  let size = 0n;
  size += U64_SIZE; // amount (u64)
  size += U16_SIZE; // script version (u16)
  size += U64_SIZE; // length of script public key (u64)
  size += BigInt(output.script?.length ?? PUBKEY_SCRIPT_SIZE);
  return size;
}

export function transactionSize(tx) {
  const inputs = tx.inputs || [];
  const outputs = tx.outputs || [];
  let size = 0n;
  size += U16_SIZE; // tx version (u16)
  size += U64_SIZE; // number of inputs (u64)
  for (const input of inputs) size += inputSize(input);
  size += U64_SIZE; // number of outputs (u64)
  for (const output of outputs) size += outputSize(output);
  size += U64_SIZE; // lock time (u64)
  size += SUBNETWORK_ID_SIZE;
  size += U64_SIZE; // gas (u64)
  size += HASH_SIZE; // payload hash
  size += U64_SIZE; // payload length (u64)
  size += BigInt(tx.payload?.length ?? 0);
  return size;
}

export function transactionComputeMass(tx, {
  massPerTxByte = MASS_PER_TX_BYTE,
  massPerScriptPubKeyByte = MASS_PER_SCRIPT_PUB_KEY_BYTE,
  massPerSigOp = MASS_PER_SIG_OP,
} = {}) {
  let mass = massPerTxByte * transactionSize(tx);
  for (const output of tx.outputs || []) {
    mass += massPerScriptPubKeyByte * (U16_SIZE + BigInt(output.script?.length ?? PUBKEY_SCRIPT_SIZE));
  }
  for (const input of tx.inputs || []) {
    mass += massPerSigOp * BigInt(input.sigOpCount ?? 0);
  }
  return mass;
}

export function utxoPlurality(output) {
  return ceilDiv(UTXO_CONST_STORAGE + BigInt(output.script?.length ?? PUBKEY_SCRIPT_SIZE), UTXO_UNIT_SIZE);
}

// https://github.com/kaspanet/rusty-kaspa/blob/v1.0.1/consensus/core/src/mass/mod.rs#L338-L412
export function transactionStorageMass(tx, {
  storageMassParameter = STORAGE_MASS_PARAMETER,
} = {}) {
  const outputs = tx.outputs || [];
  const inputs = tx.inputs || [];
  const [outsPlurality, harmonicOuts] = outputs
    .map((output) => {
      const plurality = utxoPlurality(output);
      return { plurality, amount: output.amount };
    })
    .reduce(
      ([accPlurality, accHarmonic], { plurality, amount }) => [
        accPlurality + plurality,
        accHarmonic + (storageMassParameter * plurality * plurality) / amount,
      ],
      [0n, 0n],
    );
  const [insPlurality, harmonicIns, sumIns] = inputs
    .map((input) => {
      const utxo = input.utxo;
      const plurality = utxoPlurality(utxo);
      return { plurality, amount: utxo.amount };
    })
    .reduce(
      ([accPlurality, accHarmonic, accSum], { plurality, amount }) => [
        accPlurality + plurality,
        accHarmonic + (storageMassParameter * plurality * plurality) / amount,
        accSum + amount,
      ],
      [0n, 0n, 0n],
    );
  if (outsPlurality === 1n || insPlurality === 1n || (outsPlurality === 2n && insPlurality === 2n)) {
    const mass = harmonicOuts - harmonicIns;
    return mass > 0n ? mass : 0n;
  }
  if (insPlurality === 0n) return 0n;
  const meanIns = sumIns / insPlurality;
  if (meanIns === 0n) return 0n;
  const arithmeticIns = insPlurality * (storageMassParameter / meanIns);
  const mass = harmonicOuts - arithmeticIns;
  return mass > 0n ? mass : 0n;
}

export function transactionMass(tx, params) {
  const storageMass = transactionStorageMass(tx, params);
  const computeMass = transactionComputeMass(tx, params);
  return computeMass > storageMass ? computeMass : storageMass;
}
