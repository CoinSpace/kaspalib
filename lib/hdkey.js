import { HDKey as BaseHDKey } from '@scure/bip32';

export const MAINNET_VERSIONS = {
  public: 0x038f332e, // kpub
  private: 0x038f2ef4, // kprv
};

// testnet, simnet, devnet
export const TESTNET_VERSIONS = {
  public: 0x0390a241, // ktub
  private: 0x03909e07, // ktrv
};

export class HDKey extends BaseHDKey {
  constructor(opt) {
    super({
      versions: opt.versions ?? MAINNET_VERSIONS,
      depth: opt.depth,
      index: opt.index,
      parentFingerprint: opt.parentFingerprint,
      chainCode: opt.chainCode,
      publicKey: opt.privateKey === null ? opt.publicKey : null,
      privateKey: opt.privateKey,
    });
  }
  static fromMasterSeed(seed, versions = MAINNET_VERSIONS) {
    return new HDKey(super.fromMasterSeed(seed, versions));
  }
  static fromExtendedKey(base58key, versions = MAINNET_VERSIONS) {
    return new HDKey(super.fromExtendedKey(base58key, versions));
  }
  get publicKeySchnorr() {
    return this.pubKey?.slice(1);
  }
  derive(path) {
    return new HDKey(super.derive(path));
  }
  deriveChild(index) {
    return new HDKey(super.deriveChild(index));
  }
}
