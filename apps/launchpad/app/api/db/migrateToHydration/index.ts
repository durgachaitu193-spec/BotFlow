/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiPromise, WsProvider } from '@polkadot/api'
import { BN } from '@polkadot/util'
import { serverExecuteTx } from '@/api/v1/utils/serverExecuteTx'
import { INITIAL_MINT, LISTING_MNEMONIC } from '@/global/constants'
import { networkConstants } from '@/global/networkConstants'
import { Network } from '@/global/types'
import { getKeyringPairFromMnemonic } from '../token/utils/getKeyringPairFromMnemonic'
import { assetRegistration } from './utils/assetRegistration'
import { createPoolAndRemoveLiquidity } from './utils/creatingPool'
import { limitedTeleportAssets } from './utils/limitedTeleportAssets'
import { saveAssetID } from './utils/saveAssetIdToDB'
import { sendDotToHydration } from './utils/sendDotToHydration'
import { transferToHydrationTx } from './utils/transferToHydration'

export async function migrateToHydraDX({
  sender,
  assetId,
  hydraAmount: dotAmount,
  assetAmount,
}: {
  sender: any
  assetId: string
  hydraAmount: string
  assetAmount: string
}) {
  // Connect to AssetHub Polkadot
  let hydraAmount = dotAmount
  const assetHubPolkadotProvider = new WsProvider(
    networkConstants[Network.ASSESTHUB_POLKADOT].rpcEndpoint
  )
  const assetHubPolkadotApi = await ApiPromise.create({
    provider: assetHubPolkadotProvider,
  })
  // Connect to HydraDX
  const hydradxProvider = new WsProvider('wss://hydradx-rpc.dwellir.com')
  const hydradxApi = await ApiPromise.create({ provider: hydradxProvider })

  // Connect to Polkadot
  const polkadotProvider = new WsProvider('wss://polkadot.api.onfinality.io/public-ws')
  const polkadotApi = await ApiPromise.create({ provider: polkadotProvider })

  await Promise.allSettled([assetHubPolkadotApi.isReady, hydradxApi.isReady, polkadotApi.isReady])
  if (LISTING_MNEMONIC === undefined) {
    return console.log('LISTING_MNEMONIC is not defined')
  }

  const listingAddress = await getKeyringPairFromMnemonic(LISTING_MNEMONIC)

  const assetTx = assetHubPolkadotApi.tx.assets.transfer(
    assetId,
    listingAddress.address,
    assetAmount
  )
  const dotTx = assetHubPolkadotApi.tx.balances.transferAll(listingAddress.address, true)

  const transferToListingAddressTx = assetHubPolkadotApi.tx.utility.batchAll([assetTx, dotTx])

  // send Asset to HydraX Address
  // send Dot to HydraX Address
  await serverExecuteTx({
    api: assetHubPolkadotApi,
    apiReady: true,
    network: Network.ASSESTHUB_POLKADOT,
    tx: transferToListingAddressTx,
    address: sender,
    onFailed: async () => {
      console.log('Transaction failed on transferAssets to HydraDX Listing Address')
    },
  })

  const assetRegistrationTx = assetRegistration({
    api: hydradxApi,
    assetId,
  })

  // console.log("Registering Asset to HydraDX");

  const assetRegistrationResponse = await serverExecuteTx({
    api: hydradxApi,
    apiReady: true,
    network: 'hydration',
    tx: assetRegistrationTx,
    address: listingAddress,
    onFailed: async () => {
      console.log('Transaction failed on registerAsset to HydraDX')
    },
  })

  if (!assetRegistrationResponse?.data) {
    console.log('Asset Registration Failed')
    return
  }

  const hydxAssetId = assetRegistrationResponse.data

  // AssetHub to HydraDX (DOT and Assets)
  // sending the asset to HydraDX
  const assetToHydraDXTx = transferToHydrationTx({
    api: assetHubPolkadotApi,
    account: listingAddress.address,
    assetId,
    tokens: assetAmount,
    extraAsset: true,
  })

  await serverExecuteTx({
    api: assetHubPolkadotApi,
    apiReady: true,
    network: Network.ASSESTHUB_POLKADOT,
    tx: assetToHydraDXTx,
    address: listingAddress,
    onFailed: async () => {
      console.log('Transaction failed on registerAsset to HydraDX')
    },
  })

  // --------------------- sending the DOT to HydraDX ---------------------

  // sending assetHub DOT to polkadot DOT
  const assetHubToPolkadotTx = limitedTeleportAssets({
    api: assetHubPolkadotApi,
    account: listingAddress.address,
    tokens: hydraAmount,
  })

  await serverExecuteTx({
    api: assetHubPolkadotApi,
    apiReady: true,
    network: Network.ASSESTHUB_POLKADOT,
    tx: assetHubToPolkadotTx,
    address: listingAddress,
    onFailed: async () => {
      console.log('Transaction failed on registerAsset to HydraDX')
    },
  })

  hydraAmount = new BN(hydraAmount).sub(new BN('5000000000')).toString()

  // sending DOT to HydraDX
  const dotToHydraDXTx = sendDotToHydration({
    api: polkadotApi,
    account: listingAddress.address,
    tokens: hydraAmount,
  })

  await serverExecuteTx({
    api: polkadotApi,
    apiReady: true,
    network: 'polkadot',
    tx: dotToHydraDXTx,
    address: listingAddress,
    onFailed: async () => {
      console.log('Transaction failed on registerAsset to HydraDX')
    },
  })

  hydraAmount = new BN(hydraAmount).sub(new BN('5000000000')).toString()
  // creating pool and removing liquidity
  const createPoolAndRemoveLiquidityTx = createPoolAndRemoveLiquidity({
    api: hydradxApi,
    asset1Id: '5',
    asset1Amount: hydraAmount,
    asset2Id: hydxAssetId,
    asset2Amount: assetAmount,
  })

  const poolCreationTx = await serverExecuteTx({
    api: hydradxApi,
    apiReady: true,
    network: 'hydration',
    tx: createPoolAndRemoveLiquidityTx,
    address: listingAddress,
    onFailed: async () => {
      console.log('Transaction failed on registerAsset to HydraDX')
    },
  })

  if (poolCreationTx?.status === 'error') {
    console.log('Pool Creation Failed', JSON.stringify(poolCreationTx))
    return
  }

  // burn remaining Assets
  const amount = INITIAL_MINT.sub(new BN(assetAmount)).sub(new BN(1))
  const burnAssetTx = assetHubPolkadotApi.tx.assets.burn(assetId, sender.address, amount)
  await serverExecuteTx({
    api: assetHubPolkadotApi,
    apiReady: true,
    network: Network.ASSESTHUB_POLKADOT,
    tx: burnAssetTx,
    address: sender,
    onFailed: async () => {
      console.log('Transaction failed on registerAsset to HydraDX')
    },
  })

  // save the hydxAssetId in the database
  await saveAssetID({ assetId, hydradxId: hydxAssetId })
}
