import type { ApiPromise } from '@polkadot/api'
import type { Injected, InjectedWindow } from '@polkadot/extension-inject/types'
import { APP_NAME } from '../constants'
import type { Wallet } from '../types'

export default async function setSigner(api: ApiPromise, chosenWallet: Wallet, address: string) {
  if (!api || !chosenWallet || !address) throw new Error('Please select an address')

  const injectedWindow = typeof window !== 'undefined' && (window as Window & InjectedWindow)

  if (!injectedWindow) {
    console.log('Injected Window is null', injectedWindow)
    return
  }

  const wallet = injectedWindow.injectedWeb3[String(chosenWallet)]

  if (!wallet) {
    return
  }

  let injected: Injected | undefined
  try {
    injected = await new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Wallet Timeout'))
      }, 60000) // wait 60 sec

      if (wallet?.enable) {
        wallet
          .enable(APP_NAME)
          .then((value: Injected | PromiseLike<Injected | undefined> | undefined) => {
            clearTimeout(timeoutId)
            resolve(value)
          })
          .catch((error: unknown) => {
            reject(error)
          })
      }
    })
  } catch (err) {
    console.log(err)
  }
  if (!injected) {
    return
  }
  api.setSigner(injected.signer)
}
