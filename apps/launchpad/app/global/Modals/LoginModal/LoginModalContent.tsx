'use client'

import type React from 'react'
import type { InjectedWindow } from '@polkadot/extension-inject/types'
import { stringToHex } from '@polkadot/util'
import { Alert as AntdAlert, Button as AntdButton } from 'antd'
import { useUserDetailsContext } from '@/context'
import { APP_NAME, SIGN_MESSAGE } from '@/global/constants'
import { Wallet } from '@/global/types'
import { getSubstrateAddress } from '@/global/utils/getSubstrateAddress'
import AddressDropdown from '@/ui-components/AddressDropdown'

const Alert = AntdAlert as any
const Button = AntdButton as any

import NextImage from 'next/image'

const Image = NextImage as any

import { useState } from 'react'
import WalletButtonsRow from '@components/WalletButtonsRow'
import { login } from './client-actions'

function LoginModalContent({ onClose }: { onClose?: () => void }) {
  const { setUserDetails } = useUserDetailsContext()

  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null)
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null)

  const onWalletClick = async (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    wallet: Wallet
  ) => {
    setSelectedWallet(wallet)
  }

  const onWalletLogin = async () => {
    setLoading(true)
    try {
      if (!selectedAddress || !selectedWallet) throw new Error('Please select an address')
      const substrateAddress = getSubstrateAddress(selectedAddress)

      const injectedWindow = window as Window & InjectedWindow
      const injectedWallet =
        injectedWindow?.injectedWeb3?.[
          String(selectedWallet === Wallet.NOVAWALLET ? Wallet.POLKADOT : selectedWallet)
        ]
      if (!injectedWallet) throw new Error('Please select an address')

      setLoading(true)

      const injected = injectedWallet?.enable && (await injectedWallet.enable(APP_NAME))

      const signRaw = injected?.signer?.signRaw
      if (!signRaw) throw new Error('Signer not available. Please refresh and try again.')

      if (!substrateAddress) throw new Error('Invalid address')

      const { signature } = await signRaw({
        address: substrateAddress,
        data: stringToHex(SIGN_MESSAGE),
        type: 'bytes',
      })

      const { data, error } = await login({
        address: selectedAddress,
        wallet: selectedWallet,
        signature,
      })

      if (!data || error) throw new Error(error)

      setUserDetails({
        wallet: selectedWallet,
        address: data.address,
        userId: null,
      })
      typeof window !== 'undefined' && localStorage.setItem('address', data.address)
      typeof window !== 'undefined' && localStorage.setItem('wallet', selectedWallet)
      typeof window !== 'undefined' && localStorage.setItem('signature', signature)
      onClose?.()
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='flex flex-col gap-6 p-3 text-sm'>
      {error && <Alert message={error} />}

      {selectedWallet ? (
        <div className='flex flex-col justify-center gap-6'>
          <h3 className='flex items-center justify-start gap-3 font-medium text-lg capitalize'>
            <Image
              alt='wallet icon'
              src={
                selectedWallet !== Wallet.NOVAWALLET
                  ? `/assets/icons/wallets/${selectedWallet.toLowerCase()}.svg`
                  : '/assets/icons/wallets/nova.jpg'
              }
              height={24}
              width={24}
            />
            {selectedWallet.replaceAll('-', ' ')}
          </h3>

          <AddressDropdown
            wallet={selectedWallet === Wallet.NOVAWALLET ? Wallet.POLKADOT : selectedWallet}
            onAddressSelect={setSelectedAddress}
          />

          <Button
            className='mx-auto w-3/6 bg-button-gradient'
            loading={loading}
            onClick={onWalletLogin}
          >
            Login
          </Button>

          <Button
            color='default'
            className='mx-auto border-none'
            disabled={loading}
            onClick={() => {
              setError('')
              setSelectedWallet(null)
            }}
          >
            Go back
          </Button>
        </div>
      ) : (
        <div className='flex flex-col items-center justify-center gap-5 pb-10'>
          <div className='text-center text-gray-500'>Login with web-3 wallet</div>
          <WalletButtonsRow disabled={loading} onWalletClick={onWalletClick} />
        </div>
      )}
    </div>
  )
}

export default LoginModalContent
