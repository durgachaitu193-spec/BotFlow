// Copyright 2019-2025 @blobscriptions/marketplace authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import type { ISubstrateExecuteProps } from '@/global/types'

export const executeTx = async ({
  api,
  apiReady,
  network,
  tx,
  address,
  params = {},
  onSuccess,
  onFailed,
  onBroadcast,
  setStatus,
}: ISubstrateExecuteProps) => {
  if (!api || !apiReady || !tx) {
    console.log('api not ready')
    return
  }
  tx.signAndSend(address, params, async ({ status, events, txHash, txIndex }) => {
    if (status.isInvalid) {
      console.log('Transaction invalid')
      setStatus?.('Transaction invalid')
    } else if (status.isReady) {
      console.log('Transaction is ready')
      setStatus?.('Transaction is ready')
    } else if (status.isBroadcast) {
      console.log('Transaction has been broadcasted')
      setStatus?.('Transaction has been broadcasted')
      onBroadcast?.()
    } else if (status.isInBlock) {
      console.log('Transaction is in block')
      setStatus?.('Transaction is in block')
      const blockHash = status.asInBlock.toString()

      for (const { event } of events) {
        if (event.method === 'ExtrinsicSuccess') {
          onSuccess(blockHash, String(txIndex), txHash.toString())
          setStatus?.('Transaction Success')
        } else if (event.method === 'ExtrinsicFailed') {
          setStatus?.('Transaction failed')
          console.log('Transaction failed')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const dispatchError = (event.data as any)?.dispatchError

          if (dispatchError?.isModule) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const errorModule = (event.data as any)?.dispatchError?.asModule
            const { method, section, docs } = api.registry.findMetaError(errorModule)
            const errorMessageFallbackString = `${section}.${method} : ${docs.join(' ')}`
            console.log(errorMessageFallbackString, 'error module')
            await onFailed(`${errorMessageFallbackString} error module`)
          } else if (dispatchError?.isToken) {
            console.log(`${dispatchError.type}.${dispatchError.asToken.type}`)
            await onFailed(`${dispatchError.type}.${dispatchError.asToken.type}`)
          } else {
            await onFailed(`${dispatchError.type}` || 'Transaction failed')
          }
        }
      }
    } else if (status.isFinalized) {
      console.log(`Transaction has been included in blockHash ${status.asFinalized.toHex()}`)
      console.log(`tx: https://${network}.subscan.io/extrinsic/${txHash}`)
    }
  }).catch((error: unknown) => {
    console.log(':( transaction failed')
    setStatus?.(':( transaction failed')
    console.error('ERROR:', error)
    onFailed(error?.toString?.() || 'Error in transaction execution')
  })
}
