# kaspalib

Kaspa transaction primitives and low level utilities.

## Installation

```bash
npm install kaspalib
```

## Usage

```js
import { schnorr } from '@noble/curves/secp256k1.js';
import {
  Address,
  Transaction,
  p2pk,
  transactionMass,
} from 'kaspalib';

const privKey = new Uint8Array(32).fill(1);
const pubKey = schnorr.getPublicKey(privKey);

// Encode Schnorr P2PK address
const address = Address().encode({
  type: 'pk',
  payload: pubKey,
});
console.log('address', address);

// Build and serialize transaction
const tx = new Transaction({
  inputs: [{
    utxo: {
      transactionId: new Uint8Array(32),
      index: 0,
      amount: 10_000_000n,
      version: 0,
      script: p2pk(pubKey).script,
    },
    sigOpCount: 1,
  }],
  outputs: [{
    amount: 9_000_000n,
    version: 0,
    script: p2pk(new Uint8Array(32).fill(2)).script,
  }],
});

tx.sign(privKey);

console.log('mass', transactionMass(tx));
console.log('hex', tx.toBytes());
console.log('json', tx.toRPCTransaction());
```

## Features

- Kaspa address encoding/decoding.
- Transaction normalization, serialization and signing helpers.
- Mass computation utilities mirrored from `rusty-kaspa`.

## License

MIT
