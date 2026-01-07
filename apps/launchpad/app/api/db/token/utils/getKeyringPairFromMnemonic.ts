import { Keyring } from '@polkadot/api'
import { cryptoWaitReady, mnemonicToMiniSecret } from '@polkadot/util-crypto'

export async function getKeyringPairFromMnemonic(mnemonic: string) {
  try {
    await cryptoWaitReady()
    const seed = mnemonicToMiniSecret(mnemonic)
    const keyring = new Keyring({ type: 'sr25519' })
    return keyring.addFromSeed(seed)
  } catch (error) {
    throw new Error('Error getting keyring pair for marketplace address.')
  }
}
