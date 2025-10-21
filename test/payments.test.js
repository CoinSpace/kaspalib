import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { hexToBytes } from 'kaspalib/utils.js';
import { ADDRESS_PREFIXES, Address, MAX_SCRIPT_PUBLIC_KEY_VERSION, OutScript } from 'kaspalib';

describe('OutScript.decode', () => {
  const TESTS = [{
    name: 'valid pubkey script',
    scriptHex: '204a23f5eef4b2dead811c7efb4f1afbd8df845e804b6c36a4001fc096e13f8151ac',
    version: MAX_SCRIPT_PUBLIC_KEY_VERSION,
    expected: 'pk',
  },
  {
    name: 'valid pubkey ecdsa script',
    // fix invalid ecdsa public key '21fd4a23f5eef4b2dead811c7efb4f1afbd8df845e804b6c36a4001fc096e13f8151ab'
    scriptHex: '21034a23f5eef4b2dead811c7efb4f1afbd8df845e804b6c36a4001fc096e13f8151ab',
    version: MAX_SCRIPT_PUBLIC_KEY_VERSION,
    expected: 'pk-ecdsa',
  },
  {
    name: 'valid scripthash script',
    scriptHex: 'aa204a23f5eef4b2dead811c7efb4f1afbd8df845e804b6c36a4001fc096e13f815187',
    version: MAX_SCRIPT_PUBLIC_KEY_VERSION,
    expected: 'sh',
  },
  {
    name: 'non standard script (unexpected version)',
    scriptHex: '204a23f5eef4b2dead811c7efb4f1afbd8df845e804b6c36a4001fc096e13f8151ac',
    version: MAX_SCRIPT_PUBLIC_KEY_VERSION + 1,
    expected: 'unknown',
  },
  {
    name: 'non standard script (unexpected key len)',
    scriptHex: '1f4a23f5eef4b2dead811c7efb4f1afbd8df845e804b6c36a4001fc096e13f81ac',
    version: MAX_SCRIPT_PUBLIC_KEY_VERSION,
    expected: 'unknown',
  },
  {
    name: 'non standard script (unexpected final check sig op)',
    scriptHex: '204a23f5eef4b2dead811c7efb4f1afbd8df845e804b6c36a4001fc096e13f8151ad',
    version: MAX_SCRIPT_PUBLIC_KEY_VERSION,
    expected: 'unknown',
  }];

  for (const { name, scriptHex, version, expected } of TESTS) {
    test(name, () => {
      const script = hexToBytes(scriptHex);
      const payment = OutScript.decode({ version, script });
      assert.equal(payment.type, expected);
    });
  }
});

describe('OutScript.decode and Address.decode', () => {
  const TESTS = [
    {
      name: 'Mainnet PubKey script and address',
      scriptHex: '207bc04196f1125e4f2676cd09ed14afb77223b1f62177da5488346323eaa91a69ac',
      version: MAX_SCRIPT_PUBLIC_KEY_VERSION,
      prefix: ADDRESS_PREFIXES.mainnet,
      expectedType: 'pk',
      expectedAddress: 'kaspa:qpauqsvk7yf9unexwmxsnmg547mhyga37csh0kj53q6xxgl24ydxjsgzthw5j',
    },
    {
      name: 'Testnet PubKeyECDSA script and address',
      // fix invalid ecdsa public key '21ba01fc5f4e9d9879599c69a3dafdb835a7255e5f2e934e9322ecd3af190ab0f60eab'21ba01fc5f4e9d9879599c69a3dafdb835a7255e5f2e934e9322ecd3af190ab0f60eab
      scriptHex: '21034a23f5eef4b2dead811c7efb4f1afbd8df845e804b6c36a4001fc096e13f8151ab',
      version: MAX_SCRIPT_PUBLIC_KEY_VERSION,
      prefix: ADDRESS_PREFIXES.testnet,
      expectedType: 'pk-ecdsa',
      // fix invalid ecdsa address kaspatest:qxaqrlzlf6wes72en3568khahq66wf27tuhfxn5nytkd8tcep2c0vrse6gdmpks
      expectedAddress: 'kaspatest:qyp55gl4am6t9h4dsyw8a760rtaa3huyt6qykmpk5sqplsykuylcz5gl8a5ewvv',
    },
    {
      name: 'Testnet non standard script',
      scriptHex: '2001fc5f4e9d9879599c69a3dafdb835a7255e5f2e934e9322ecd3af190ab0f60eab',
      version: MAX_SCRIPT_PUBLIC_KEY_VERSION,
      prefix: ADDRESS_PREFIXES.testnet,
      expectedType: 'unknown',
      expectedThrow: 'Unknown address type=unknown',
    },
    {
      name: 'Mainnet script with unknown version',
      scriptHex: '207bc04196f1125e4f2676cd09ed14afb77223b1f62177da5488346323eaa91a69ac',
      version: MAX_SCRIPT_PUBLIC_KEY_VERSION + 1,
      prefix: ADDRESS_PREFIXES.mainnet,
      expectedType: 'unknown',
      expectedThrow: 'Unknown address type=unknown',
    },
  ];

  for (const { name, scriptHex, version, prefix, expectedType, expectedAddress, expectedThrow } of TESTS) {
    test(name, () => {
      const script = hexToBytes(scriptHex);
      const scriptPublicKey = { version, script };

      const payment = OutScript.decode(scriptPublicKey);
      assert.equal(payment.type, expectedType);

      if (expectedAddress) {
        const address = Address({ prefix }).encode({ type: payment.type, payload: payment.payload });
        assert.equal(address, expectedAddress);
        const encoded = OutScript.encode({ version, type: payment.type, payload: payment.payload });
        assert.deepEqual(encoded, scriptPublicKey);
      }
      if (expectedThrow) {
        assert.throws(() => {
          Address({ prefix }).encode({ type: payment.type, payload: payment.payload });
        }, { message: expectedThrow });
      }
    });
  }
});
