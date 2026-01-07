import type { ApiPromise } from '@polkadot/api'
import { BN } from '@polkadot/util'
import {
  CREATION_FEE,
  FEE_ADDRESS,
  INITIAL_MINT,
  MINIMUM_ASSET_BALANCE,
  SWAP_FEE,
  TOKEN_DECIMAL,
} from '@/global/constants'
import type { Network } from '@/global/types'
import { executeTx } from '@/global/utils/executeTx'
import { nextApiFetch } from '@/global/utils/nextApiFetch'

interface ICreateTokenTxProps {
  twitter?: string
  telegram?: string
  website?: string
  api: ApiPromise
  name: string
  description?: string
  logo?: string
  network: Network
  symbol: string
  address: string
  setStatus?: (status: string) => void
  setLoading?: (loading: boolean) => void
  afterSuccess?: (id: string) => void
}

export const createToken = async ({
  api,
  network,
  name,
  symbol,
  description,
  logo,
  address,
  twitter,
  telegram,
  website,
  setStatus,
  setLoading,
  afterSuccess,
}: ICreateTokenTxProps) => {
  if (!api) {
    console.log('API not found')
    return
  }

  // get all asset ids
  const assetIds = await api.query.assets.asset.keys()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ids = assetIds.map((asset: any) => asset.toHuman()?.[0].split(',').join(''))
  const nextAssetId = Math.max(...ids) + 1
  // generate token in DB
  const { data, error } = await nextApiFetch({
    url: 'api/v1/create',
    method: 'POST',
    data: {
      address,
      id: nextAssetId,
      name,
      symbol,
      description,
      logo,
      twitter,
      telegram,
      website,
      network,
    },
  })

  if (!data && error) {
    setLoading?.(false)
    console.log('Error creating token', error)
    return
  }

  const { substrateAddress } = data as { substrateAddress: string }

  // setting up transactions
  const createTx = api.tx.assets.create(nextAssetId, substrateAddress, MINIMUM_ASSET_BALANCE)
  const setMetaDataTx = api.tx.assets.setMetadata(nextAssetId, name, symbol, TOKEN_DECIMAL)
  const mintTx = api.tx.assets.mint(nextAssetId, substrateAddress, INITIAL_MINT)
  const mainTx = api.tx.utility.batchAll([createTx, setMetaDataTx, mintTx])
  const { partialFee } = await mainTx.paymentInfo(substrateAddress)

  // Transfer funds to the token creation address
  const transferTx = api.tx.balances.transferKeepAlive(
    substrateAddress,
    CREATION_FEE.add(new BN(partialFee.toJSON())).toString()
  )
  const feeTx = api.tx.balances.transferKeepAlive(FEE_ADDRESS, SWAP_FEE.toString())

  const tx = api.tx.utility.batchAll([feeTx, transferTx])

  const onSuccess = async (blockHash: string, txIndex: string, hash: string) => {
    try {
      await nextApiFetch({
        url: 'api/v1/create/token',
        method: 'POST',
        data: {
          blockHash,
          txIndex,
          txHash: hash,
          id: nextAssetId.toString(),
        },
      })
      setLoading?.(false)
      afterSuccess?.(String(nextAssetId))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      throw new Error(error)
    }
  }
  const onFailed = (error: string) => {
    setLoading?.(false)
    throw new Error(error)
  }

  await executeTx({
    api,
    apiReady: true,
    network: network,
    tx,
    address,
    params: {},
    onSuccess,
    onFailed,
    setStatus: setStatus || (() => {}),
  })
}
