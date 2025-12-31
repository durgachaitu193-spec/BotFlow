'use client'

import { useEffect, useState } from 'react'
// import DotProgress from "../components/DotProgress";
import { BN } from '@polkadot/util'
import NextImage from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import CandlestickChart from '@/components/CandlestickChart'
import { calculateTotalCost, SCALING_FACTOR } from '@/lib/bounding-curve'
import { formatBnBalance } from '@/global/utils/formatBnBalance'
import { shortenAddress } from '@/global/utils/shortenAddress'
import Loader from '@/ui-components/Loader'
import SecondaryButton from '@/ui-components/SecondaryButton'
import BondingCurve from '../components/BondingCurve'
import DotProgress from '../components/DotProgress'
import HolderDistribution from '../components/HolderDistribution'
import PlaceTrade from '../components/PlaceTrade'
import Threads from '../components/Threads'

const Image = NextImage as any

import type { IToken } from '@/global/types'
import HydrationLink from '@/ui-components/HydrationLink'

const Token = () => {
  const { id } = useParams() as { id: string }
  const [token, setToken] = useState({} as IToken)
  const [loading, setLoading] = useState(true)
  const [marketCap, setMarketCap] = useState<BN>(new BN(0))
  const [tokenName, setTokenName] = useState('')
  const [symbol, setSymbol] = useState('')
  const router = useRouter()

  const fetchTokens = async () => {
    try {
      const response = await fetch(`/api/v1/token?id=${id}`)
      const data = await response.json()
      if (data?.tokens && data.tokens.length > 0) {
        const tokenData = data.tokens[0]
        setToken(tokenData)
        setTokenName(tokenData.name)
        setSymbol(tokenData.symbol)
      }
    } catch (error) {
      console.error('Failed to fetch token:', error)
    }
  }
  useEffect(() => {
    if (Object.keys(token).length === 0 || !token.id) {
      fetchTokens().finally(() => {
        setLoading(false)
      })
    }
  }, [])

  useEffect(() => {
    if (!token.id) {
      return
    }
    const { cost } = calculateTotalCost(
      new BN(token.supply),
      new BN(1),
      new BN(token.reserveBalance)
    )
    const payload = cost.mul(new BN(token.supply).div(SCALING_FACTOR))
    setMarketCap(payload)
  }, [token])

  if (loading) return <Loader />

  return (
    <div className='h-full px-[30px] py-6 sm:px-[100px]'>
      <div className='mb-6 flex w-full'>
        <SecondaryButton
          icon={<Image src='/assets/arrow-left-white.png' height={24} width={24} alt='go-back' />}
          onClick={() => router.back()}
          className='text-base'
        >
          go back
        </SecondaryButton>
      </div>
      <div className='hidden w-full gap-x-8 lg:flex'>
        <div className='flex w-[65%] flex-col gap-y-6'>
          <div className='flex items-center gap-x-4'>
            {token.tradeDisabled && <HydrationLink hydradxId={token.hydradxId} />}
            <div className='font bold'>
              Market Cap:{' '}
              {formatBnBalance(marketCap, {
                numberAfterComma: 2,
                withUnit: true,
              })}
            </div>
          </div>
          <CandlestickChart id={id} />
          <Threads ticker={token.symbol} id={id} />
        </div>
        <div className='flex w-[35%] flex-col gap-y-6'>
          <PlaceTrade
            tokenName={tokenName}
            symbol={symbol}
            supply={token?.supply}
            id={id as string}
            reserveBalance={token.reserveBalance}
            disabled={token?.tradeDisabled || false}
            hydradxId={token?.hydradxId}
          />
          <div className='flex flex-col gap-y-4'>
            <div className='flex items-center gap-x-4'>
              {token.twitter && (
                <a
                  href={token.twitter}
                  target='_blank'
                  rel='noreferrer'
                  className='rounded-md bg-bg_primary p-2'
                >
                  <Image src='/assets/twitter.png' alt='twitter' width={24} height={24} />
                </a>
              )}
              {token.telegram && (
                <a
                  href={token.telegram}
                  target='_blank'
                  rel='noreferrer'
                  className='rounded-md bg-bg_primary p-2'
                >
                  <Image src='/assets/telegram.png' alt='telegram' width={24} height={24} />
                </a>
              )}
            </div>
            <div className='flex items-start gap-x-2 text-white'>
              <img
                src={token.logo || '/assets/meme-image.png'}
                alt='Coin image'
                height={118}
                width={120}
                className='max-h-[120px] max-w-[120px]'
              />
              <div className='flex h-full flex-col gap-y-1'>
                <span>
                  Created By:{' '}
                  {token.createdBy &&
                    shortenAddress({
                      text: token.createdBy,
                      startChars: 4,
                      endChars: 4,
                    })}
                </span>
                <span className='mb-2 max-w-[300px] break-words font-bold text-base text-primary'>
                  {token.name} [ticker: {token.symbol} ]
                </span>
                <span className='max-w-[300px] break-words text-sm'>{token.description}</span>
              </div>
            </div>
          </div>
          <BondingCurve reserveBalance={token.reserveBalance} supply={token.supply} />
          <DotProgress reserveBalance={token.reserveBalance} />
          <HolderDistribution
            currentSupply={new BN(token.supply)}
            substrateAddress={token.ethereumAddress}
            id={token.id}
          />
        </div>
      </div>
      <div className='flex w-full flex-col gap-y-6 lg:hidden'>
        <div className='font bold'>
          Market Cap: {formatBnBalance(marketCap, { numberAfterComma: 2, withUnit: true })}
        </div>
        {token.tradeDisabled && <HydrationLink hydradxId={token.hydradxId} className='text-sm' />}
        <CandlestickChart id={id} />
        <PlaceTrade
          tokenName={token.name}
          symbol={token.symbol}
          supply={token.supply}
          id={id as string}
          reserveBalance={token.reserveBalance}
          disabled={token.tradeDisabled || false}
        />
        <div className='flex flex-col gap-y-4'>
          <div className='flex items-center gap-x-4'>
            {token.twitter && (
              <a
                href={token.twitter}
                target='_blank'
                rel='noreferrer'
                className='rounded-md bg-bg_primary p-2'
              >
                <Image src='/assets/twitter.png' alt='twitter' width={24} height={24} />
              </a>
            )}
            {token.telegram && (
              <a
                href={token.telegram}
                target='_blank'
                rel='noreferrer'
                className='rounded-md bg-bg_primary p-2'
              >
                <Image src='/assets/telegram.png' alt='telegram' width={24} height={24} />
              </a>
            )}
          </div>
          <div className='flex items-start gap-x-2 text-white'>
            <img
              src={token.logo || '/assets/meme-image.png'}
              alt='Coin image'
              height={118}
              width={120}
              className='max-h-[120px] max-w-[120px]'
            />
            <div className='flex h-full flex-col gap-y-1'>
              <span>
                Created By:{' '}
                {token.createdBy &&
                  shortenAddress({
                    text: token.createdBy,
                    startChars: 4,
                    endChars: 4,
                  })}
              </span>
              <span className='mb-2 max-w-[300px] break-words font-bold text-base text-primary'>
                {token.name} [ticker: {token.symbol} ]
              </span>
              <span className='max-w-[300px] break-words text-sm'>{token.description}</span>
            </div>
          </div>
        </div>
        <BondingCurve reserveBalance={token.reserveBalance} supply={token.supply} />
        <DotProgress reserveBalance={token.reserveBalance} />
        <HolderDistribution
          currentSupply={new BN(token.supply)}
          substrateAddress={token.ethereumAddress}
          id={token.id}
        />
        <Threads ticker={token.symbol} id={id} />
      </div>
    </div>
  )
}

export default Token
