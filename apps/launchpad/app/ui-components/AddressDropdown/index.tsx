'use client'

import { useCallback, useEffect, useState } from 'react'
import type { ApiPromise } from '@polkadot/api'
import type { InjectedAccount, InjectedWindow } from '@polkadot/extension-inject/types'
import Identicon from '@polkadot/react-identicon'
import { Alert, Dropdown, Skeleton } from 'antd'
import { useApiContext } from '@/context'
import { APP_NAME } from '@/global/constants'
import type { Wallet } from '@/global/types'
import { getWalletAccounts } from '@/global/utils/getWalletAccounts'
import { shortenAddress } from '@/global/utils/shortenAddress'

interface Props {
  disabled?: boolean
  wallet: Wallet
  label?: string
  onAddressSelect: (account: string) => void
}

function AddressDropdown({ disabled, label, wallet, onAddressSelect }: Props) {
  const { api, apiReady, network } = useApiContext()
  const [extensionNotFound, setExtensionNotFound] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [walletError, setWalletError] = useState('')
  const [accountsNotFound, setAccountsNotFound] = useState<boolean>(false)
  const [accounts, setAccounts] = useState<InjectedAccount[]>([])
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null)
  const [selectedAddressName, setSelectedAddressName] = useState<string | null>(null)

  const handleSetSigner = async (apiPromise: ApiPromise) => {
    const injectedWindow = window as Window & InjectedWindow
    const injectedWallet = injectedWindow?.injectedWeb3?.[String(wallet)]

    if (!injectedWallet) {
      setWalletError('Please select a wallet.')
      return
    }

    const injected = injectedWallet?.enable && (await injectedWallet.enable(APP_NAME))
    if (!injected) {
      setWalletError('Please select a valid wallet.')
      return
    }

    apiPromise.setSigner(injected.signer)
  }

  const handleOnAddressSelect = useCallback(
    (account: InjectedAccount) => {
      if (disabled) return
      setSelectedAddress(account.address)
      onAddressSelect(account.address)

      if (!apiReady) {
        ;(async () => {
          setLoading(true)

          await api?.isReady
          if (api) handleSetSigner(api)

          setLoading(false)
        })()
      } else if (api) handleSetSigner(api)
    },
    [onAddressSelect]
  )

  useEffect(() => {
    getWalletAccounts({
      wallet,
      network,
      setExtensionNotFound,
      setLoading,
      setWalletError,
      setAccountsNotFound,
      setAccounts,
      setSelectedAddress: handleOnAddressSelect,
    })
  }, [handleOnAddressSelect, network, onAddressSelect, wallet])

  if (extensionNotFound) {
    return <Alert message={`${wallet} extension not found.`} />
  }

  if (accountsNotFound) {
    return <Alert message={`Accounts not found on ${wallet} extension.`} />
  }

  if (loading) {
    return (
      <Skeleton className='rounded-lg'>
        <div className='h-12 rounded-lg bg-default-300' />
      </Skeleton>
    )
  }

  return (
    <div className='flex w-full flex-col gap-3'>
      {walletError && <Alert message={walletError} />}
      <div className='flex w-full flex-col gap-1'>
        {label && <small className='text-foreground/60 text-xs'>{label}</small>}
        <Dropdown
          className='w-full'
          menu={{
            items: accounts.map((account) => ({
              key: `${account.address}_${account.name}`,
              label: (
                <div className='flex items-center gap-3'>
                  <Identicon theme='polkadot' value={account.address} size={30} />
                  <span>{account.name || 'Untitled'}</span>
                </div>
              ),
            })),
            onClick: (e) => {
              const address = e.key.split('_')[0]
              const name = e.key.split('_')[1]
              setSelectedAddress(address)
              setSelectedAddressName(name)
              onAddressSelect(address)
            },
          }}
        >
          <div className='flex w-full items-center gap-3 rounded-lg border border-gray-700 p-2'>
            <Identicon theme='polkadot' value={selectedAddress} size={30} />
            <span>
              {selectedAddressName ||
                shortenAddress({
                  text: selectedAddress || '',
                  startChars: 4,
                  endChars: 4,
                })}
            </span>
          </div>
        </Dropdown>
      </div>
    </div>
  )
}

export default AddressDropdown
