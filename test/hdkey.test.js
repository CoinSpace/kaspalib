/* eslint-disable max-len */
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { mnemonicToSeedSync } from '@scure/bip39';

import { ADDRESS_PREFIXES, Address } from 'kaspalib/address.js';
import { HDKey, MAINNET_VERSIONS, TESTNET_VERSIONS } from 'kaspalib/hdkey.js';

const GEN1_RECEIVE_ADDRESSES = [
  'kaspa:qz7ulu4c25dh7fzec9zjyrmlhnkzrg4wmf89q7gzr3gfrsj3uz6xjellj43pf',
  'kaspa:qzn3qjzf2nzyd3zj303nk4sgv0aae42v3ufutk5xsxckfels57dxjjed4qvlx',
  'kaspa:qpakxqlesqywgkq7rg4wyhjd93kmw7trkl3gpa3vd5flyt59a43yyjp28qsku',
  'kaspa:qz0skffpert8cav6h2c9nfndmhzzfhvkrjexclmwgjjwt0sutysnw6lp55ak0',
  'kaspa:qrmzemw6sm67svltul0qsk3974ema4auhrja3k68f4sfhxe4mxjwx0cj353df',
  'kaspa:qpe4apax5dquy600py9rprmukhq8fqyqv9qu072twkvgse0glhqa74ynxmvfr',
  'kaspa:qrptdge6ykdq672xqjd4rv2cedwdcz030jngsr2xhaxrn5l8pfhc294x9c7x6',
  'kaspa:qqnys5nyennjkvyl77vwneq5j2vmjss57zerd88ptzaeqhm998smxw28uth8l',
  'kaspa:qztckuvk02885rdazvj9w079qujg5qpxcdnmsvxqx0q8z7l483prkszjqwwff',
  'kaspa:qrp53krck4m0x6n0dxs7vzf5mg0x6we8e06xjpmu8xr8p4du6f89khqdzw6uw',
  'kaspa:qr4l3mahqe0jeeu6c474q5tywz08mudhddgtdneeq46unv0qx0j77kdtr52uu',
  'kaspa:qzatdsueklx7pkfzanh9u0pwr47sd3a25gfm8wypsevdejhhpj8ck3v74v54j',
  'kaspa:qqk3g5l6ymdkjfmzezx4zrv9fhr5rh0d8tm07udkqxq79n6t60tzu3fa7lnqg',
  'kaspa:qqasa6d590u6875hsese68fa9f8mnedzesn2udehp0s73ggt5cklw2ge393eq',
  'kaspa:qpuzq5jc757uxue9fradme33jd6egxr9fdznd8qysqcc5xy8k7alqpjgpdgrn',
  'kaspa:qqygznwmkl56vprrnvyvnta9qql43yv52m3qz2462vxskn32axl0xccnpsqx9',
  'kaspa:qqk974yml6uuustenwu57hn8n7d202luvn4dum0txvzjgg60g2jzsknngheak',
  'kaspa:qpxqat995cxnjla8nm0dwnneesqnk5enc6hqrua7jztels0eqjg8vsm032lww',
  'kaspa:qpyzkjs2a6k8ljx2qt4pwscj6jccr6k7pmru9k7r2t25teajjuzaz7zkesu0e',
  'kaspa:qzf5mxtvk8wgp8gr3dcj3dkzdu6w4dgpvp2f0gm9pepv9vazxrhy577fy87rt',
  'kaspa:qz44rhjkrddak9vf5z4swlmenxtfhmqc47d0lyf0j7ednyjln0u824ue33gvr',
];

const GEN1_CHANGE_ADDRESSES = [
  'kaspa:qrqrnyzdwh9ec2q05guzy3vv33f86nvdyw52qwlmk0mewzx3dgdss3pmcd692',
  'kaspa:qqx8jlz0hh0wun5ru4glt9za3v8wj3jn7v3w55a0lyud74ppetqfqny4yhw87',
  'kaspa:qzpa69mrh2nj6xk6gq38vcnzu64necp0jwaxxyusr9xcy5udhu2m7uvql8rnd',
  'kaspa:qqxddf76hr39dc7k7lpdzg065ajtvrhlm5p3edm4gyen0waneryss2c0la85t',
  'kaspa:qps4qh9dtskwvf923yl9utl74r8sdm9h2wv3mftuxcfc2cshwswc6txj0k2kl',
  'kaspa:qrds58d6nw9uz7z93ds4l6x9cgw3rquqzr69dtch6n4d8fxum8c65f7nqmhzx',
  'kaspa:qrajjrpj0krqkww7rymwuwzcd36grjr6688ynvna649q26zukhcq6eqf4jmnx',
  'kaspa:qrumkgz7hlsa748tnzvpztmf6wu9zsgqh6rppw4gzw2mvyq4ccj0y3ms9ju5l',
  'kaspa:qz2g3cj3jcklk4w95djwnm9dffcwg75aqct2pefsxujrldgs08wac99rz70rc',
  'kaspa:qznmzsvk0srfkur8l9pf55st0hnh3x8tmdyskjl9570w99lxsgs7cwrhxap2r',
  'kaspa:qptamza95k7tchmukulldps4kl6wk853dnwa52t4azzm76h588qjufmnu3rn7',
  'kaspa:qqt9h5cjqu9an68cn9k9jc2ywqmqu6kswjzeu09tqulswxkuccaxg6wz45f5r',
  'kaspa:qphr6uy46ad3ca7rerzkx7kkzfzsvfe0xanh4u5mrh538cexs4yjkww0pa4dh',
  'kaspa:qzv3qlh5q4fpy6eu5s4wj080l64del4lvg986z5uh0c3g7wf6n8pvsgm3c9e0',
  'kaspa:qp2dd6y4szgyhcendh7ncxws0qvx8k3s92tg7lvy8eel5npg4pd2ks0ctx4hl',
  'kaspa:qpkqvnkler4rwlpt720unepf3q8cayv0shx0vzydrae7a6u7ryy8zdvnmncyc',
  'kaspa:qr4v33jupxv9h6juqads0znrnw6g7an2ajuzusthnjqujquz66rewtjekhz4l',
  'kaspa:qz5pq2yzpz8ce5avrsa4uzzwrlr5a86rvs74afd6qdm3h649v08nk0qxhrl9n',
  'kaspa:qrajmn035raezl6rcvd0wvnfmdnc0qzwr686ccsrn3z5x8aqnpt8qa0e954jk',
  'kaspa:qrqg7r05nk7syxjh8rdz8wanzmyh8sdts9uexxnnwkq8fplrjammvcnrdggw0',
];

const GEN1_TESTNET_RECEIVE_ADDRESSES = [
  'kaspatest:qz7ulu4c25dh7fzec9zjyrmlhnkzrg4wmf89q7gzr3gfrsj3uz6xjceef60sd',
  'kaspatest:qzn3qjzf2nzyd3zj303nk4sgv0aae42v3ufutk5xsxckfels57dxjnltw0jwz',
  'kaspatest:qpakxqlesqywgkq7rg4wyhjd93kmw7trkl3gpa3vd5flyt59a43yyn8vu0w8c',
  'kaspatest:qz0skffpert8cav6h2c9nfndmhzzfhvkrjexclmwgjjwt0sutysnwme80mr8t',
  'kaspatest:qrmzemw6sm67svltul0qsk3974ema4auhrja3k68f4sfhxe4mxjwxw752m0ud',
  'kaspatest:qpe4apax5dquy600py9rprmukhq8fqyqv9qu072twkvgse0glhqa75z4a5jc8',
  'kaspatest:qrptdge6ykdq672xqjd4rv2cedwdcz030jngsr2xhaxrn5l8pfhc2ynq7hqh7',
  'kaspatest:qqnys5nyennjkvyl77vwneq5j2vmjss57zerd88ptzaeqhm998smx0vp8yfkm',
  'kaspatest:qztckuvk02885rdazvj9w079qujg5qpxcdnmsvxqx0q8z7l483prk3y5mpscd',
  'kaspatest:qrp53krck4m0x6n0dxs7vzf5mg0x6we8e06xjpmu8xr8p4du6f89kkxtepyd2',
  'kaspatest:qr4l3mahqe0jeeu6c474q5tywz08mudhddgtdneeq46unv0qx0j77htdcm5dc',
  'kaspatest:qzatdsueklx7pkfzanh9u0pwr47sd3a25gfm8wypsevdejhhpj8cks2cwr2yk',
  'kaspatest:qqk3g5l6ymdkjfmzezx4zrv9fhr5rh0d8tm07udkqxq79n6t60tzus0m9sd3v',
  'kaspatest:qqasa6d590u6875hsese68fa9f8mnedzesn2udehp0s73ggt5cklwtwl220gy',
  'kaspatest:qpuzq5jc757uxue9fradme33jd6egxr9fdznd8qysqcc5xy8k7alqq5w6zkjh',
  'kaspatest:qqygznwmkl56vprrnvyvnta9qql43yv52m3qz2462vxskn32axl0xe746l7hp',
  'kaspatest:qqk974yml6uuustenwu57hn8n7d202luvn4dum0txvzjgg60g2jzsh44nc8vj',
  'kaspatest:qpxqat995cxnjla8nm0dwnneesqnk5enc6hqrua7jztels0eqjg8v3af29pl2',
  'kaspatest:qpyzkjs2a6k8ljx2qt4pwscj6jccr6k7pmru9k7r2t25teajjuzazlyszlz7a',
  'kaspatest:qzf5mxtvk8wgp8gr3dcj3dkzdu6w4dgpvp2f0gm9pepv9vazxrhy5lc0lgqj0',
];

describe.only('HDKey', () => {
  test('mainnet addresses gen1', () => {
    const root = HDKey.fromExtendedKey('kprv5y2qurMHCsXYrNfU3GCihuwG3vMqFji7PZXajMEqyBkNh9UZUJgoHYBLTKu1eM4MvUtomcXPQ3Sw9HZ5ebbM4byoUciHo1zrPJBQfqpLorQ');
    const account = root.derive("m/44'/111111'/0'");
    for (let index = 0; index < 20; index++) {
      const receive = Address().encode({
        type: 'pk',
        payload: account.deriveChild(0).deriveChild(index).publicKeySchnorr,
      });
      assert.equal(receive, GEN1_RECEIVE_ADDRESSES[index], `receive address at ${index} failed`);
      const change = Address().encode({
        type: 'pk',
        payload: account.deriveChild(1).deriveChild(index).publicKeySchnorr,
      });
      assert.equal(change, GEN1_CHANGE_ADDRESSES[index], `change address at ${index} failed`);
    }
  });

  test('testnet addresses gen1', () => {
    const root = HDKey.fromExtendedKey('kprv5y2qurMHCsXYrNfU3GCihuwG3vMqFji7PZXajMEqyBkNh9UZUJgoHYBLTKu1eM4MvUtomcXPQ3Sw9HZ5ebbM4byoUciHo1zrPJBQfqpLorQ');
    const account = root.derive("m/44'/111111'/0'");
    for (let index = 0; index < 20; index++) {
      const receive = Address({ prefix: ADDRESS_PREFIXES.testnet }).encode({
        type: 'pk',
        payload: account.deriveChild(0).deriveChild(index).publicKeySchnorr,
      });
      assert.equal(receive, GEN1_TESTNET_RECEIVE_ADDRESSES[index], `receive address at ${index} failed`);
    }
  });

  test('mainnet wallet from mnemonic', () => {
    const seed = mnemonicToSeedSync('fringe ceiling crater inject pilot travel gas nurse bulb bullet horn segment snack harbor dice laugh vital cigar push couple plastic into slender worry');
    const root = HDKey.fromMasterSeed(seed);
    const kprv = root.privateExtendedKey;
    assert.equal(
      kprv,
      'kprv5y2qurMHCsXYrpeDB395BY2DPKYHUGaCMpFAYRi1cmhwin1bWRyUXVbtTyy54FCGxPnnEvbK9WaiaQgkGS9ngGxmHy1bubZYY6MTokeYP2Q',
      'master kprv not matched'
    );
    const wallet = HDKey.fromExtendedKey(kprv);
    const kpub = wallet.derive("m/44'/111111'/0'").publicExtendedKey;
    assert.equal(
      kpub,
      'kpub2HtoTgsG6e1c7ixJ6JY49otNSzhEKkwnH6bsPHLAXUdYnfEuYw9LnhT7uRzaS4LSeit2rzutV6z8Fs9usdEGKnNe6p1JxfP71mK8rbUfYWo',
      'drived kpub not matched'
    );
  });

  test('testnet wallet and address from mnemonic', () => {
    const seed = mnemonicToSeedSync('hunt bitter praise lift buyer topic crane leopard uniform network inquiry over grain pass match crush marine strike doll relax fortune trumpet sunny silk');
    const root = HDKey.fromMasterSeed(seed, TESTNET_VERSIONS);
    const ktrv = root.privateExtendedKey;
    assert.equal(
      ktrv,
      'ktrv5himbbCxArFU2CHiEQyVHP1ABS1tA1SY88CwePzGeM8gHfWmkNBXehhKsESH7UwcxpjpDdMNbwtBfyPoZ7W59kYfVnUXKRgv8UguDns2FQb',
      'master ktrv not matched'
    );
    const wallet = HDKey.fromExtendedKey(ktrv, TESTNET_VERSIONS);
    const ktub = wallet.derive("m/44'/111111'/0'").publicExtendedKey;
    assert.equal(
      ktub,
      'ktub23beJLczbxoS4emYHxm5H2rPnXJPGTwjNLAc8JyjHnSFLPMJBj5h3U8oWbn1x1jayZRov6uhvGd4zUGrWH6PkYZMWsykUsQWYqjbLnHrzUE',
      'drived ktub not matched'
    );
    const address = Address({ prefix: ADDRESS_PREFIXES.testnet }).encode({
      type: 'pk',
      payload: wallet.derive("m/44'/111111'/0'/0/1").publicKeySchnorr,
    });
    assert.equal(address, 'kaspatest:qrc2959g0pqda53glnfd238cdnmk24zxzkj8n5x83rkktx4h73dkc4ave6wyg');
  });

  test('mnemonic reproduce Kaspa mainnet HD root key', () => {
    const seed = mnemonicToSeedSync('cruise village slam canyon monster scrub myself farm add riot large board sentence outer nice coast raven bird scheme undo december blanket trim hero');
    const root = HDKey.fromMasterSeed(seed, MAINNET_VERSIONS);
    const kprv = root.privateExtendedKey;
    assert.equal(
      kprv,
      'kprv5y2qurMHCsXYr8yytxy6ZwYWLtFbdtWWavDL6bPfz2fNLvnZymmNfE6KpQqNHHjb7mAWYCtuUkZPbkgUR19LSKS9VasqRR852L5GMVY8wf9',
      'xprv is not valid'
    );
  });

  test('mnemonic reproduce Kaspa testnet HD root key', () => {
    const seed = mnemonicToSeedSync('short diagram life tip retreat nothing dynamic absent lamp carry mansion keen truck cram crash science liberty emotion live pepper orphan quiz wide prison');
    const root = HDKey.fromMasterSeed(seed, TESTNET_VERSIONS);
    const ktrv = root.privateExtendedKey;
    assert.equal(
      ktrv,
      'ktrv5himbbCxArFU23gGTxVHNKahNXXSETHjNWgwc5qm85nKS1p55FEb8DUdTd2CPvQvBUKYFRSjjXb5nagr7wXUE4eSaFSxof8cUd6Sm66NRjA',
      'xprv is not valid'
    );
  });
});
