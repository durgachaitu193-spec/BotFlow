import { BN, BN_ZERO } from '@polkadot/util'
import dayjs from 'dayjs'
import { calculateTotalCost } from '@/lib/bounding-curve'
import { CURRENT_NETWORK } from '../constants'
import type { IChartData, ITransaction } from '../types'
import { formatBnBalance } from './formatBnBalance'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// eslint-disable-next-line @typescript-eslint/no-require-imports
const _ = require('lodash')

export const parseTransactionData = (transactions: ITransaction[]) => {
  let supply = BN_ZERO
  let reserveBalance = BN_ZERO
  const allTx = transactions.map((item) => {
    if (item.type === 'buy') {
      supply = supply.add(new BN(item.amount))
    } else if (item.type === 'sell') {
      supply = supply.sub(new BN(item.amount))
    }
    const { cost, reserveBalance: newReserveBalance } = calculateTotalCost(
      supply,
      new BN(1),
      reserveBalance
    )
    reserveBalance = newReserveBalance

    let date: Date
    if (item.createdAt instanceof Date) {
      date = item.createdAt
    } else if (typeof item.createdAt === 'object' && 'seconds' in item.createdAt) {
      // Firebase Timestamp
      date = new Date((item.createdAt as any).seconds * 1000)
    } else {
      date = new Date(item.createdAt)
    }

    return {
      createdAt: date,
      currentPrice: new BN(cost),
    }
  })

  return aggregateByMinute(allTx)
}

// Function to aggregate data by minute
function aggregateByMinute(data: { createdAt: Date; currentPrice: BN }[]): IChartData[] {
  type ParsedData = { createdAt: dayjs.Dayjs; currentPrice: BN }
  const parsedData = data.map((dp) => ({
    ...dp,
    createdAt: dayjs(dp.createdAt),
  }))

  const groupedByMinute = _.groupBy(parsedData, (dp: ParsedData) => {
    if (!dp?.createdAt?.isValid()) {
      return null
    }
    return dp.createdAt.format('YYYY-MM-DD HH:mm:00')
  })

  groupedByMinute.null = undefined

  return Object.entries(groupedByMinute)
    .filter(([key]) => key !== 'null')
    .map(([minuteKey, entries]) => {
      const open = (entries as ParsedData[])[0].currentPrice
      return {
        x: dayjs(minuteKey).format('YYYY-MM-DDTHH:mm:ss'),
        y: formatBnBalance(open, { numberAfterComma: 5 }, CURRENT_NETWORK).split(',').join(''),
      }
    })
}

export const parseTransactionDataOHLC = (transactions: ITransaction[]) => {
  let supply = BN_ZERO
  let reserveBalance = BN_ZERO

  // 1. Calculate price for each transaction
  const allTx = transactions.map((item) => {
    if (item.type === 'buy') {
      supply = supply.add(new BN(item.amount))
    } else if (item.type === 'sell') {
      supply = supply.sub(new BN(item.amount))
    }
    const { cost, reserveBalance: newReserveBalance } = calculateTotalCost(
      supply,
      new BN(1),
      reserveBalance
    )
    reserveBalance = newReserveBalance

    let date: Date
    if (item.createdAt instanceof Date) {
      date = item.createdAt
    } else if (typeof item.createdAt === 'object' && 'seconds' in item.createdAt) {
      date = new Date((item.createdAt as any).seconds * 1000)
    } else {
      date = new Date(item.createdAt)
    }

    return {
      createdAt: date,
      currentPrice: new BN(cost),
    }
  })

  // 2. Group by minute (or hour/day depending on needs, sticking to minute for now)
  type ParsedData = { createdAt: dayjs.Dayjs; currentPrice: BN }
  const parsedData = allTx.map((dp) => ({
    ...dp,
    createdAt: dayjs(dp.createdAt),
  }))

  const groupedByMinute = _.groupBy(parsedData, (dp: ParsedData) => {
    if (!dp?.createdAt?.isValid()) return null
    // Grouping by minute
    return dp.createdAt.format('YYYY-MM-DD HH:mm:00')
  })

  groupedByMinute.null = undefined

  // 3. Convert to OHLC
  const ohlcData = Object.entries(groupedByMinute)
    .filter(([key]) => key !== 'null')
    .map(([minuteKey, entries]) => {
      const txs = entries as ParsedData[]
      // Sort by time within the minute to get correct Open/Close
      txs.sort((a, b) => a.createdAt.valueOf() - b.createdAt.valueOf())

      const prices = txs.map((t) =>
        Number.parseFloat(
          formatBnBalance(t.currentPrice, { numberAfterComma: 8 }, CURRENT_NETWORK)
            .split(',')
            .join('')
        )
      )

      const open = prices[0]
      const close = prices[prices.length - 1]
      const high = Math.max(...prices)
      const low = Math.min(...prices)

      // Convert time to unix timestamp (seconds) for lightweight-charts
      const time = dayjs(minuteKey).unix()

      return {
        time,
        open,
        high,
        low,
        close,
      }
    })

  // Sort by time
  ohlcData.sort((a, b) => a.time - b.time)

  return ohlcData
}
