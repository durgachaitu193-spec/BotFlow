/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { Button as AntdButton } from 'antd'
import SecondaryButton from '@/ui-components/SecondaryButton'

const Button = AntdButton as any

import { useCallback, useEffect, useRef, useState } from 'react'
import { CopyOutlined as AntdCopyOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { shortenAddress } from '@/global/utils/shortenAddress'
import Address from '@/ui-components/Address'

const CopyOutlined = AntdCopyOutlined as any

import copyText from '@/global/utils/copyText'
import Comments from './Comments'

// import formatBigNumbers from "@/global/utils/formatBigNumbers";

enum ETab {
  THREADS = 'Threads',
  TRADES = 'Trades',
}

const Threads = ({ id, ticker }: { id: string; ticker: string }) => {
  const [tab, setTab] = useState<ETab>(ETab.THREADS)
  const ref = useRef(null)
  const [txns, setTxns] = useState<any[]>([])

  const fetchTxns = useCallback(async () => {
    if (!id) return
    try {
      const response = await fetch(`/api/v1/transactions?tokenId=${id}`)
      const data = await response.json()
      if (data?.transactions) {
        const transactionsArray = data.transactions.map((item: any) => ({
          ...item,
          createdAt: dayjs(item.createdAt).toDate(),
        }))
        setTxns(transactionsArray)
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    }
  }, [id])

  useEffect(() => {
    fetchTxns()
  }, [])

  return (
    <div ref={ref}>
      <div className='mb-2 flex items-center justify-between'>
        <div className='flex items-center gap-x-3'>
          <Button
            onClick={() => setTab(ETab.THREADS)}
            className={`${tab === ETab.THREADS ? 'bg-primary text-black' : 'bg-transparent text-white'} border-none p-2 font-bold text-[16px]`}
          >
            {ETab.THREADS}
          </Button>
          <Button
            onClick={() => setTab(ETab.TRADES)}
            className={`${tab === ETab.TRADES ? 'bg-primary text-black' : 'bg-transparent text-white'} border-none p-2 font-bold text-[16px]`}
          >
            {ETab.TRADES}
          </Button>
        </div>
        <SecondaryButton
          onClick={() =>
            ref.current &&
            (ref.current as any).scrollIntoView({
              behavior: 'smooth',
              block: 'end',
            })
          }
        >
          scroll to bottom
        </SecondaryButton>
      </div>
      {tab === ETab.TRADES ? (
        <div className='flex w-[full] flex-col gap-y-3 overflow-x-auto'>
          <div className='grid min-w-[650px] grid-cols-6 rounded-[12px] bg-bg_primary p-3'>
            <p className='col-span-1'>Account</p>
            <p className='col-span-1'>Type</p>
            <p className='col-span-1'>BNB</p>
            <p className='col-span-1'>{ticker}</p>
            <p className='col-span-1'>Date</p>
            <p className='col-span-1 text-right'>Tx Hash</p>
          </div>
          {txns &&
            txns.length > 0 &&
            txns.map((item) => (
              <div
                key={item.txHash}
                className='grid min-w-[650px] grid-cols-6 rounded-[12px] bg-bg_primary p-3'
              >
                <p className='col-span-1'>
                  <Address address={item.to} startChars={4} endChars={4} />
                </p>
                <p className='col-span-1'>{item.type}</p>
                <p className='col-span-1'>{(item.value / 10 ** 11).toFixed(4)}</p>{' '}
                <p className='col-span-1'>{item.amount}</p>
                <p className='col-span-1'>{dayjs(item.createdAt).format('DD MMM, LT')}</p>
                <p className='col-span-1 flex items-center justify-end gap-x-2'>
                  {shortenAddress({
                    text: item.txHash,
                    startChars: 4,
                    endChars: 4,
                  })}
                  <CopyOutlined onClick={() => copyText(item.txHash)} />
                </p>
              </div>
            ))}
        </div>
      ) : (
        <Comments tokenId={id} />
      )}
    </div>
  )
}

export default Threads
