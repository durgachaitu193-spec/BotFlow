import { BN_BILLION } from '@polkadot/util'
import { Progress } from 'antd'
import BN from 'bn.js'
import { useApiContext } from '@/context'
import { DX_LIST_AMOUNT } from '@/global/constants'
import { formatBnBalance } from '@/global/utils/formatBnBalance'

const getPercentage = (currentAmount: BN) => {
  if (currentAmount.isZero()) return 0
  if (currentAmount.gte(DX_LIST_AMOUNT)) return 100
  const total = DX_LIST_AMOUNT // also in BN
  // calculate the percentage
  return currentAmount.mul(new BN(100)).div(total).toNumber()
}

const BondingCurve = ({ reserveBalance, supply }: { reserveBalance: string; supply: string }) => {
  const { network } = useApiContext()
  const percentage = getPercentage(new BN(reserveBalance))

  const total = BN_BILLION.mul(new BN(10).pow(new BN(10)))
  const totalAvailable = total.sub(new BN(supply))
  return (
    <div className='flex flex-col gap-y-3'>
      <p className='font-bold text-[20px] text-heading'>Bonding curve Progress: {percentage}%</p>
      <Progress
        showInfo={false}
        strokeWidth={25}
        className='w-full'
        percent={percentage}
        trailColor='#1D2132'
        strokeColor='#87EFAC'
      />
      <p className='mb-1 text-white'>
        when the market cap reaches $6000 all the liquidity from the bonding curve will be deposited
        into Hydration and burned. progression increases as the price goes up.
      </p>
      <p className='text-white'>
        there are {formatBnBalance(totalAvailable, { numberAfterComma: 2 })} tokens still available
        for sale in the bonding curve and there is{' '}
        {formatBnBalance(reserveBalance, { numberAfterComma: 2 }, network)} BNB in the bonding
        curve.
      </p>
    </div>
  )
}

export default BondingCurve
