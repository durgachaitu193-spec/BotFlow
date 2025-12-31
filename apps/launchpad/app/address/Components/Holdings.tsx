'use client'

import NextLink from 'next/link'
import { useUserDetailsContext } from '@/context'
import { getSubstrateAddress } from '@/global/utils/getSubstrateAddress'
import Address from '@/ui-components/Address'
import Loader from '@/ui-components/Loader'

const Link = NextLink as any

import { useCallback, useEffect, useState } from 'react'

interface IToken {
  id: string
  name: string
  symbol: string
  logo?: string
  createdBy: string
  description?: string
}

const Holdings = () => {
  const { address } = useUserDetailsContext()

  const [loading, setLoading] = useState<boolean>(false)

  const [holdings, setHoldings] = useState<{
    [id: string]: { token: IToken; value: string }
  }>({})

  const fetchHoldings = useCallback(async () => {
    if (!address) return
    setLoading(true)
    try {
      const substrateAddr = getSubstrateAddress(address) || address
      const response = await fetch(`/api/v1/user/${substrateAddr}`)

      if (!response.ok) {
        setHoldings({})
        return
      }

      const data = await response.json()
      const userHoldings = data.holdings?.userHoldings || {}
      const tokenIds = Object.keys(userHoldings)

      const newHoldings: { [id: string]: { token: IToken; value: string } } = {}

      await Promise.all(
        tokenIds.map(async (id) => {
          try {
            const tokenRes = await fetch(`/api/v1/token/${id}`)
            if (tokenRes.ok) {
              const tokenData = await tokenRes.json()
              if (tokenData.token) {
                newHoldings[id] = {
                  token: { ...tokenData.token, id },
                  value: userHoldings[id],
                }
              }
            }
          } catch (e) {
            console.error(`Failed to fetch token ${id}`, e)
          }
        })
      )

      setHoldings(newHoldings)
    } catch (error) {
      console.error('Error fetching holdings:', error)
    } finally {
      setLoading(false)
    }
  }, [address])

  useEffect(() => {
    fetchHoldings()
  }, [fetchHoldings])
  return (
    <div className='grid-col-1 grid gap-x-4 gap-y-10 md:grid-cols-2 lg:grid-cols-3'>
      {loading && <Loader />}
      {holdings && Object.keys(holdings) && Object.keys(holdings)?.length > 0 ? (
        Object.values(holdings).map((item, i) => {
          return (
            <Link href={`/token/${item.token.id}`} key={`${item.token.id}_${i}`}>
              <div className='token-card flex items-start gap-x-2 bg-transparent p-2 text-white'>
                <img
                  src={item.token.logo || '/assets/meme-image.png'}
                  alt='Coin image'
                  height={118}
                  width={120}
                  className='max-h-[120px] max-w-[120px]'
                />
                <div className='flex h-full flex-col gap-y-1'>
                  <span className='flex items-center gap-x-2'>
                    Created By:{' '}
                    <Address address={item.token.createdBy} startChars={4} endChars={4} />
                  </span>
                  <span className='mb-2 max-w-[300px] break-all font-bold text-base text-primary'>
                    {item.token.name} [ticker: {item.token.symbol} ]
                  </span>
                  <span className='max-w-[300px] break-all text-sm'>
                    Value: {item.value} {item.token.symbol}
                  </span>
                  <span className='max-w-[300px] break-all text-sm'>{item.token.description}</span>
                </div>
              </div>
            </Link>
          )
        })
      ) : (
        <div>No Holdings</div>
      )}
    </div>
  )
}

export default Holdings
