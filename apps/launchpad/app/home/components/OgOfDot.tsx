'use client'

import NextLink from 'next/link'
import type { IToken } from '@/global/types'
import Address from '@/ui-components/Address'

const Link = NextLink as any

import { useEffect, useState } from 'react'

const OgOfDot = () => {
  const [og, setOG] = useState<IToken | null>(null)

  const fetchTokens = async () => {
    try {
      const response = await fetch('/api/v1/token')
      const data = await response.json()
      if (data?.tokens) {
        const tokensArray: IToken[] = data.tokens
        const ogOfDot = tokensArray
          .sort((a, b) => Number(b.reserveBalance) - Number(a.reserveBalance))
          .filter((item) => !item.tradeDisabled)[0]
        setOG(ogOfDot)
      }
    } catch (error) {
      console.error('Failed to fetch tokens:', error)
    }
  }

  useEffect(() => {
    fetchTokens()
  }, [])

  return (
    <div className='flex flex-col items-center gap-y-4'>
      {og && (
        <>
          <p className='sarina-regular rounded-lg bg-black p-2 font-extrabold text-2xl text-yellow-500 italic shadow-lg'>
            Ride the BNB wave!
          </p>
          <Link href={`/token/${og.id}`}>
            <div className='flex items-start gap-x-2 hover:text-primary'>
              <img
                src={og.logo}
                alt='Coin image'
                height={120}
                width={120}
                className='max-h-[120px] max-w-[120px]'
              />
              <div className='flex h-full flex-col gap-y-1'>
                <span className='flex items-center gap-x-2 break-all'>
                  Created By: <Address address={og.createdBy} startChars={4} endChars={4} />
                </span>
                <span className='break-all font-bold text-base text-primary sm:text-lg'>
                  {og.name} [ticker: {og.symbol}]
                </span>
              </div>
            </div>
          </Link>
        </>
      )}
    </div>
  )
}

export default OgOfDot
