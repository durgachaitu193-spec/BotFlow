'use client'

import './style.css'
import NextLink from 'next/link'
import type { IToken } from '@/global/types'

const Link = NextLink as any

import type React from 'react'
import { useEffect, useState } from 'react'
import Holdings from '@/address/Components/Holdings'
import { useUserDetailsContext } from '@/context'
import Address from '@/ui-components/Address'
import Input from '@/ui-components/Input'
import Loader from '@/ui-components/Loader'
import PrimaryButton from '@/ui-components/PrimaryButton'
// import { skip } from "node:test";

export enum ETabs {
  TERMINAL = 'Terminal',
  HYDRATION = 'Hydration',
  HOLDINGS = 'Holdings',
}

function TokenList() {
  const [loading, setLoading] = useState<boolean>(true)
  const [tokens, setTokens] = useState<Array<IToken>>([])

  const { address } = useUserDetailsContext()

  const [tokensFiltered, setTokensFiltered] = useState<Array<IToken>>([])

  const [search, setSearch] = useState<string>('')

  const [tab, setTab] = useState<ETabs>(ETabs.TERMINAL)

  const fetchTokens = async () => {
    try {
      const response = await fetch('/api/v1/token')
      const data = await response.json()
      if (data?.tokens) {
        setTokens(data.tokens)
        setTokensFiltered(data.tokens)
      }
    } catch (error) {
      console.error('Failed to fetch tokens:', error)
    }
  }

  useEffect(() => {
    fetchTokens().finally(() => {
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (tokens) {
      const copy = [...tokens]

      const filtered = copy.filter(
        (item) =>
          item.symbol.toLowerCase().includes(search.toLowerCase()) ||
          item.name.toLowerCase().includes(search.toLowerCase())
      )

      if (filtered && filtered.length > 0) {
        setTokensFiltered(filtered)
      } else {
        setTokensFiltered(tokens)
      }
    }
  }, [search])

  if (loading) {
    return <Loader />
  }

  return (
    <div className='px-4 sm:px-[80px]'>
      <div className='mt-4 mb-10 flex w-full justify-center'>
        <Input
          placeholder='Search'
          className='search-bar w-full rounded-xl bg-white text-black sm:w-[400px]'
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          suffix={<img src='/assets/arrow-right.png' alt='arrow' height={24} width={24} />}
        />
      </div>
      <div className='mb-8 flex flex-wrap items-center gap-4 font-Agrandir font-extrabold text-xs'>
        <PrimaryButton
          className={`${tab === ETabs.TERMINAL ? 'bg-[#5030DB]' : 'bg-[#484261]'} px-6 shadow-[#8952F5]`}
          onClick={() => setTab(ETabs.TERMINAL)}
        >
          {ETabs.TERMINAL}
        </PrimaryButton>
        {/* <PrimaryButton className={`${tab === ETabs.HYDRATION ? 'bg-[#5030DB]' : 'bg-[#484261]'} shadow-[#8952F5] px-6`} onClick={() => setTab(ETabs.HYDRATION)}>{ETabs.HYDRATION}</PrimaryButton> */}
        {address && (
          <PrimaryButton
            className={`${tab === ETabs.HOLDINGS ? 'bg-[#5030DB]' : 'bg-[#484261]'} px-6 shadow-[#8952F5]`}
            onClick={() => setTab(ETabs.HOLDINGS)}
          >
            {ETabs.HOLDINGS}
          </PrimaryButton>
        )}
      </div>
      {tab === ETabs.TERMINAL ? (
        <div className='grid-col-1 grid gap-x-4 gap-y-10 md:grid-cols-2 lg:grid-cols-3'>
          {tokensFiltered.map((token) => (
            <Link href={`/token/${token.id}`} key={token.id}>
              <div className='token-card flex items-start gap-x-2 bg-transparent p-2 text-white'>
                <img
                  src={token.logo || '/assets/meme-image.png'}
                  alt='Coin image'
                  height={118}
                  width={120}
                  className='max-h-[120px] max-w-[120px]'
                />
                <div className='flex h-full flex-col gap-y-1'>
                  <span className='flex items-center gap-x-2'>
                    Created By: <Address address={token.createdBy} startChars={4} endChars={4} />
                  </span>
                  <span className='mb-2 max-w-[300px] break-all font-bold text-base text-primary'>
                    {token.name} [ticker: {token.symbol} ]
                  </span>
                  <span className='max-w-[300px] break-all text-sm'>{token.description}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : tab === ETabs.HYDRATION ? (
        <div className='grid-col-1 grid gap-x-4 gap-y-10 md:grid-cols-2 lg:grid-cols-3'>
          {tokensFiltered
            .filter((item) => item.tradeDisabled)
            .map((token) => (
              <Link href={`/token/${token.id}`} key={token.id}>
                <div className='token-card flex items-start gap-x-2 bg-transparent p-2 text-white'>
                  <img
                    src={token.logo || '/assets/meme-image.png'}
                    alt='Coin image'
                    height={118}
                    width={120}
                    className='max-h-[120px] max-w-[120px]'
                  />
                  <div className='flex h-full flex-col gap-y-1'>
                    <span className='flex items-center gap-x-2'>
                      Created By: <Address address={token.createdBy} startChars={4} endChars={4} />
                    </span>
                    <span className='mb-2 max-w-[300px] break-all font-bold text-base text-primary'>
                      {token.name} [ticker: {token.symbol} ]
                    </span>
                    <span className='max-w-[300px] break-all text-sm'>{token.description}</span>
                  </div>
                </div>
              </Link>
            ))}
        </div>
      ) : (
        <Holdings />
      )}
    </div>
  )
}

export default TokenList
