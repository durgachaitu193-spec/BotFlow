/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect, useState } from 'react'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { encodeAddress } from '@polkadot/util-crypto'
import { Button } from 'antd'
import NextLink from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useApiContext, useUserDetailsContext } from '@/context'
// import queueNotification, {
//   NotificationStatus,
// } from "@/ui-components/QueueNotifications";
import SecondaryButton from '@/ui-components/SecondaryButton'
import Holdings from '../Components/Holdings'

const Link = NextLink as any

enum ETab {
  HOLDINGS = 'Holdings',
  TELEPORT = 'Teleport',
}

function Profile() {
  const { address } = useParams() as { address: string }
  const { api } = useApiContext()
  const { wallet, address: userAddress } = useUserDetailsContext()
  const [polkaApi, setPolkaApi] = useState<ApiPromise | null>(null)
  const [balance, setBalance] = useState<string | null>(null)
  const [AssetHubBalance, setAssetHubBalance] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [status, setStatus] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)

  const router = useRouter()

  const [tab, setTab] = useState<ETab>(ETab.HOLDINGS)

  const fetchBalance = async () => {
    if (!polkaApi) {
      return
    }
    try {
      const {
        data: { free: balance },
      } = (await polkaApi.query.system.account(address)) as any
      setBalance(balance.toString())
    } catch (e) {
      console.log(e)
    } finally {
      setLoading(false)
    }
  }

  const fetchAssetHubBalance = async () => {
    if (!api) {
      return
    }
    try {
      const {
        data: { free: balance },
      } = (await api.query.system.account(address)) as any
      setAssetHubBalance(balance.toString())
    } catch (e) {
      console.log(e)
    } finally {
      setLoading(false)
    }
  }

  // const handleTeleport = async () => {
  //   if (!polkaApi || !wallet || !address || !amount) {
  //     queueNotification({
  //       header: "Error",
  //       message: "RPC Error",
  //       status: NotificationStatus.ERROR,
  //     });
  //     return;
  //   }
  //   try {
  //     const formateAmount = new BN(amount).mul(new BN(10).pow(new BN(10)));
  //     setLoading(true);
  //     console.log({ formateAmount, address });
  //     setSigner(polkaApi, wallet, address);

  //     // const transfer = await sendXCMTransfer({
  //     //   api: polkaApi,
  //     //   amount: formateAmount.toString(),
  //     //   destinationAddress: address,
  //     // });

  //     // await executeTx({
  //     //   api: polkaApi,
  //     //   apiReady: true,
  //     //   onSuccess: () => {
  //     //     queueNotification({
  //     //       header: "Success",
  //     //       message: "Teleport Success",
  //     //       status: NotificationStatus.SUCCESS,
  //     //     });
  //     //     fetchBalance();
  //     //     setLoading(false);
  //     //   },
  //     //   onFailed: () => {
  //     //     queueNotification({
  //     //       header: "Error",
  //     //       message: "Error in teleport",
  //     //       status: NotificationStatus.ERROR,
  //     //     });
  //     //     setLoading(false);
  //     //   },
  //     //   address,
  //     //   tx: transfer,
  //     //   setStatus,
  //     //   network: "polkadot",
  //     // });
  //   } catch (error) {
  //     console.log(error);
  //     queueNotification({
  //       header: "Error",
  //       message: "Error in teleport",
  //       status: NotificationStatus.ERROR,
  //     });
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  useEffect(() => {
    const initApi = async () => {
      const provider = new WsProvider('wss://rpc.polkadot.io')
      const api = await ApiPromise.create({ provider })
      await api.isReady
      setPolkaApi(api)
    }
    initApi()
  }, [])

  useEffect(() => {
    if (!polkaApi || !api) return
    fetchBalance()
    fetchAssetHubBalance()
  }, [polkaApi, api])

  useEffect(() => {
    if (!address) return
    const getEncodedAddress = (address: string, ss58: number) => {
      try {
        if (address.startsWith('0x')) return address

        return encodeAddress(address, ss58)
      } catch (e) {
        return null
      }
    }
    const encodedAddress = getEncodedAddress(address, 0)
    // setIsValidAddress(isAddress(encodedAddress));
  }, [address])
  //   check if address is valid
  if (!address) {
    return <div>Invalid address</div>
  }

  return (
    <div className='py-6 font-Agrandir'>
      <div className='mb-6 flex w-full justify-center'>
        <SecondaryButton onClick={() => router.back()} className='text-[20px] sm:text-[24px]'>
          go back
        </SecondaryButton>
      </div>

      <div className='flex items-center justify-center gap-x-3'>
        <Button
          onClick={() => setTab(ETab.HOLDINGS)}
          className={`${tab === ETab.HOLDINGS ? 'bg-primary text-black' : 'bg-transparent text-white'} border-none p-2 font-bold text-[16px]`}
        >
          {ETab.HOLDINGS}
        </Button>
        {/* <Button
          onClick={() => setTab(ETab.TELEPORT)}
          className={`${tab === ETab.TELEPORT ? "bg-primary text-black" : "bg-transparent text-white"} p-2 text-[16px] font-bold border-none`}
        >
          {ETab.TELEPORT}
        </Button> */}
      </div>

      <Holdings />
    </div>
  )
}

export default Profile
