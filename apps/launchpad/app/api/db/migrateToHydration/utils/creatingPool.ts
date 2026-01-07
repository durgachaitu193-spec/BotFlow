import type { ApiPromise } from '@polkadot/api'
import { BN } from '@polkadot/util'

interface ICreatePoolAndRemoveLiquidity {
  api: ApiPromise
  asset1Id: string
  asset1Amount: string
  asset2Id: string
  asset2Amount: string
}

export const createPoolAndRemoveLiquidity = ({
  api,
  asset1Id = '5',
  asset1Amount,
  asset2Id,
  asset2Amount,
}: ICreatePoolAndRemoveLiquidity) => {
  const createPoolTx = api.tx.xyk.createPool(asset1Id, asset1Amount, asset2Id, asset2Amount)

  // remove 0.1% of liquidity
  const removeValue = new BN(asset1Amount).sub(new BN(asset1Amount).div(new BN(1000))).toString()
  const removeLiquidityTx = api.tx.xyk.removeLiquidity(asset1Id, asset2Id, removeValue)

  return api.tx.utility.batchAll([createPoolTx, removeLiquidityTx])
}
