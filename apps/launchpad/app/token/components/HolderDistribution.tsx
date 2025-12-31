import { BN } from '@polkadot/util'
import NextImage from 'next/image'
import { INITIAL_MINT } from '@/global/constants'
import { Network } from '@/global/types'
import { formatBnBalance } from '@/global/utils/formatBnBalance'
import { shortenAddress } from '@/global/utils/shortenAddress'

const Image = NextImage as any

import { useEffect, useState } from 'react'
import DonutChart from './DonutChart'

interface IHolderDistributionProps {
  substrateAddress: string
  currentSupply: BN
  id: string
}

const getPercentage = (currentAmount: BN) => {
  if (currentAmount.isZero()) return 0
  if (currentAmount.gte(INITIAL_MINT)) return 100
  const balance = Number(
    formatBnBalance(currentAmount, { numberAfterComma: 2 }, Network.ASSESTHUB_POLKADOT)
      .split(',')
      .join('')
  )
  const total = Number(
    formatBnBalance(INITIAL_MINT, { numberAfterComma: 2 }, Network.ASSESTHUB_POLKADOT)
      .split(',')
      .join('')
  )
  if (Number.isNaN(balance) || Number.isNaN(total)) {
    return 0
  }
  return ((balance / total) * 100).toFixed(3)
}

const HolderDistribution = ({ substrateAddress, currentSupply, id }: IHolderDistributionProps) => {
  const [holderDistribution, setHolderDistribution] = useState<{
    [index: string]: number
  }>({})

  const [sortedHolders, setSortedHolders] = useState<{ address: string; percentage: string }[]>([])

  const [showMore, setShowMore] = useState<boolean>(false)

  useEffect(() => {
    const fetchHolderDistribution = async () => {
      try {
        const response = await fetch(`/api/v1/holdings?tokenId=${id}`)
        const data = await response.json()
        if (data?.holdings) {
          setHolderDistribution(data.holdings)
        }
      } catch (error) {
        console.error('Error fetching holder distribution:', error)
      }
    }

    fetchHolderDistribution()
  }, [id])

  useEffect(() => {
    if (
      holderDistribution &&
      Object.keys(holderDistribution) &&
      Object.keys(holderDistribution).length > 0
    ) {
      const sorted = Object.keys(holderDistribution)
        .map((item) => ({
          address: item,
          percentage: `${getPercentage(new BN(holderDistribution[item]))}`,
        }))
        .sort((a, b) => Number(b.percentage) - Number(a.percentage))
      setSortedHolders(sorted)
    }
  }, [holderDistribution])

  return (
    <div className='flex flex-col gap-y-3'>
      <p className='mb-1 flex items-center justify-between font-bold text-[20px] text-heading text-white'>
        Holder Distribution
        <span className='text-sm text-white'>({sortedHolders.length} wallets)</span>
      </p>
      {sortedHolders?.length > 0 && <DonutChart holders={sortedHolders} />}
      <p className='flex items-center justify-between text-white'>
        <span className='font-bold'>
          {shortenAddress({
            text: substrateAddress,
            startChars: 4,
            endChars: 4,
          })}{' '}
          (Bounding curve)
        </span>
        <span>{getPercentage(INITIAL_MINT.sub(currentSupply))}%</span>
      </p>
      {sortedHolders.slice(0, 5).map((item, i) => (
        <p key={i} className='flex items-center justify-between text-white'>
          <span className='font-bold'>
            {shortenAddress({ text: item.address, startChars: 4, endChars: 4 })}
          </span>
          <span>{item.percentage}%</span>
        </p>
      ))}
      {showMore &&
        sortedHolders.slice(5).map((item, i) => (
          <p key={i} className='flex items-center justify-between text-white'>
            <span className='font-bold'>
              {shortenAddress({
                text: item.address,
                startChars: 4,
                endChars: 4,
              })}
            </span>
            <span>{item.percentage}%</span>
          </p>
        ))}
      {sortedHolders.length > 5 && (
        <p
          onClick={() => setShowMore((prev) => !prev)}
          className='flex cursor-pointer items-center gap-x-1 font-bold text-primary text-sm'
        >
          {showMore ? 'Show Less' : `Show all ${sortedHolders.length} wallets`}
          <Image
            className={`mb-[2px] ${showMore && 'rotate-[180deg]'}`}
            src='/assets/arrow-down-green.png'
            alt='show-more'
            height={16}
            width={16}
          />
        </p>
      )}
    </div>
  )
}

export default HolderDistribution
