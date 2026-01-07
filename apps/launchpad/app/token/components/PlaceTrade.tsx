'use client'
import type React from 'react'
import { useEffect, useState } from 'react'
import { Button, Input, message, Spin } from 'antd'
import NextLink from 'next/link'
import { useUserDetailsContext } from '@/context'
import LoginModal from '@/global/Modals/LoginModal'
import queueNotification, { NotificationStatus } from '@/ui-components/QueueNotifications'
import {
  buyToken,
  calculateTotalCost,
  sellToken,
} from '../../../contracts/config/BlockchainServices'

const Link = NextLink as any

import { shortenAddress } from '@/global/utils/shortenAddress'

enum ETab {
  BUY = 'Buy',
  SELL = 'Sell',
}

interface IPlaceTrade {
  tokenName: string
  symbol: string
  supply: string
  id: string
  reserveBalance: string
  disabled: boolean
  hydradxId?: string
}

const PlaceTrade = ({ tokenName, symbol, id, disabled, hydradxId }: IPlaceTrade) => {
  const { address } = useUserDetailsContext()
  const [tab, setTab] = useState<ETab>(ETab.BUY)
  const [value, setValue] = useState<string>('')
  const [costToBuy, setCostToBuy] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [maxSellLimit, setMaxSellLimit] = useState(false)
  const [error, setError] = useState<string>('')
  const [openLoginModal, setOpenLoginModal] = useState(false)
  const [costLoading, setCostLoading] = useState(false)

  const handleBuy = async () => {
    if (!value || !address) {
      console.log('Please fill all the fields: returning line number 32', value, address)
      queueNotification({
        header: 'Error',
        message: 'Please fill all the fields',
        status: NotificationStatus.ERROR,
      })
      return
    }
    try {
      setLoading(true)
      const tx = await buyToken({
        id,
        amount: Number(value),
        address,
        tokenName,
        tokenSymbol: symbol,
        cost: costToBuy,
        setLoading,
      })
      console.log('tx', tx)
      setLoading(false)
      queueNotification({
        header: 'Success',
        message: 'Token bought successfully',
        status: NotificationStatus.SUCCESS,
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      queueNotification({
        header: 'Error',
        message: error.message || error || 'Error in buy token',
        status: NotificationStatus.ERROR,
      })
      setLoading(false)
      console.log(error)
    } finally {
      setError('')
      setValue('')
      setCostToBuy('')
    }
  }

  const handleSell = async () => {
    if (!value || !address) {
      console.log('Please fill all the fields: returning line number 32', value, address)
      queueNotification({
        header: 'Error',
        message: 'Please fill all the fields',
        status: NotificationStatus.ERROR,
      })
      return
    }
    try {
      setLoading(true)
      await sellToken({
        id,
        amount: Number(value),
        address,
        tokenName,
        tokenSymbol: symbol,
        setLoading,
      })
      queueNotification({
        header: 'Success',
        message: 'Token sold successfully',
        status: NotificationStatus.SUCCESS,
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      queueNotification({
        header: 'Error',
        message: "You don't have enough token balance to sell",
        status: NotificationStatus.ERROR,
      })
      setLoading(false)
      console.log(error)
    } finally {
      setError('')
      setValue('')
      setCostToBuy('')
    }
  }
  const handleCostToBuy = async () => {
    if (value.includes('.')) {
      setError('Coin value is low, user can only buy/sell whole number of coins')
      return
    }
    setCostLoading(true)
    if (tab === ETab.BUY) {
      const cost = await calculateTotalCost({
        tokenName,
        tokenSymbol: symbol,
        amount: Number(value),
      })
      setCostToBuy(cost)
    }
    setCostLoading(false)
    setError('')
  }

  useEffect(() => {
    if (!value) {
      setCostToBuy('')
      return
    }
    setMaxSellLimit(false)
    handleCostToBuy()
  }, [value])

  const shortenSymbol = (s: string) => {
    if (s?.length > 8) {
      return shortenAddress({ text: s, startChars: 3, endChars: 3 })
    }
    return s
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (tab === ETab.BUY) {
      handleBuy()
    } else {
      handleSell()
    }
  }

  return (
    <>
      <LoginModal open={openLoginModal} onClose={() => setOpenLoginModal(false)} />
      <div className='flex w-full flex-col gap-y-6 rounded-[20px] bg-bg_primary p-6'>
        <div className='flex gap-x-3'>
          <Button
            onClick={() => setTab(ETab.BUY)}
            className={`h-[40px] w-full border-none font-bold outline-none ${tab === ETab.BUY ? 'bg-green_primary text-black' : 'bg-black text-white'}`}
          >
            {ETab.BUY}
          </Button>
          <Button
            onClick={() => setTab(ETab.SELL)}
            className={`h-[40px] w-full border-none font-bold outline-none ${tab === ETab.SELL ? 'bg-green_primary text-black' : 'bg-black text-white'}`}
          >
            {ETab.SELL}
          </Button>
        </div>
        {/* {disabled && (
          <p className="text-green-500">
            Market cap reached. Token has now entered confirmation period. It
            can be traded on HydraDX once listed . This may take upto 6 hrs{" "}
          </p>
        )} */}
        <Input
          disabled={disabled}
          placeholder='Type here'
          className={`rounded-[30px] border-white bg-transparent px-4 py-2 text-white placeholder:text-placeholder`}
          value={value}
          type='number'
          suffix={`$ ${shortenSymbol(symbol)}`}
          onChange={(e) => {
            if (Number(e.target.value) >= 0) {
              setValue(e.target.value)
            }
          }}
        />
        {error && <span className='text-rose-500'>{error}</span>}
        {maxSellLimit ? (
          <span className='text-rose-500'>{`Supply don't have that much token`}</span>
        ) : (
          costToBuy && !error && <span>{costLoading ? <Spin size='small' /> : costToBuy} BNB</span>
        )}
        <div className='flex flex-wrap gap-3'>
          <Button
            onClick={() => setValue('')}
            className='border-none bg-black p-1 font-bold text-white outline-none'
          >
            reset
          </Button>
          <Button
            onClick={() => {
              setValue('10000')
              handleCostToBuy()
            }}
            className='border-none bg-black p-1 font-bold text-white outline-none'
          >
            10K {shortenSymbol(symbol)}
          </Button>
          <Button
            onClick={() => {
              setValue('50000')
              handleCostToBuy()
            }}
            className='border-none bg-black p-1 font-bold text-white outline-none'
          >
            50k {shortenSymbol(symbol)}
          </Button>
          <Button
            onClick={() => {
              setValue('100000')
              handleCostToBuy()
            }}
            className='border-none bg-black p-1 font-bold text-white outline-none'
          >
            100K {shortenSymbol(symbol)}
          </Button>
        </div>
        {disabled ? (
          <Link
            href={`https://app.hydration.net/trade/swap?assetIn=${hydradxId || 1000222}&assetOut=5`}
            target='_blank'
          >
            <Button
              className={`h-[45px] w-full border-none bg-green_primary font-bold text-[16px] text-black outline-none`}
              onClick={!address ? () => message.error('Please Connect Wallet') : handleSubmit}
              loading={loading}
            >
              Trade on Hydration
            </Button>
          </Link>
        ) : (
          <Button
            disabled={!value || Number(value) === 0 || Boolean(error) || disabled}
            className='h-[45px] w-full border-none bg-green_primary font-bold text-[16px] text-black outline-none'
            onClick={
              !address
                ? () => {
                    message.error('Please Connect Wallet to place trade')
                  }
                : tab === ETab.BUY
                  ? handleBuy
                  : handleSell
            }
            loading={loading}
          >
            Place Trade
          </Button>
        )}
      </div>
    </>
  )
}

export default PlaceTrade
