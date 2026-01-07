import { Keyring } from '@polkadot/api'
import { cryptoWaitReady, mnemonicToMiniSecret } from '@polkadot/util-crypto'

export async function getSubstrateAddressFromMnemonic(mnemonic: string) {
  try {
    await cryptoWaitReady()
    const seed = mnemonicToMiniSecret(mnemonic)

    const keyring = new Keyring({ type: 'sr25519' })
    const pair = keyring.addFromSeed(seed)

    if (!pair.address) {
      throw new Error('Error in decoding marketplace address for this listing.')
    }

    return pair.address
  } catch (e) {
    throw new Error('Error in fetching marketplace address for this listing.')
  }
}
