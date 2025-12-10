/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useApiContext, useUserDetailsContext } from "@/context";
import { Network } from "@/global/types";
// import { executeTx } from "@/global/utils/executeTx";
import { formatBnBalance } from "@/global/utils/formatBnBalance";
// import setSigner from "@/global/utils/setSigner";
// import { sendXCMTransfer } from "@/global/utils/teleportAssets";
import Address from "@/ui-components/Address";
// import queueNotification, {
//   NotificationStatus,
// } from "@/ui-components/QueueNotifications";
import SecondaryButton from "@/ui-components/SecondaryButton";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { BN } from "@polkadot/util";
import { encodeAddress } from "@polkadot/util-crypto";
import { Button, Input, Spin } from "antd";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Holdings from "../Components/Holdings";
import NextLink from "next/link";
const Link = NextLink as any;

enum ETab {
  HOLDINGS = "Holdings",
  TELEPORT = "Teleport",
}

function Profile() {
  const { address } = useParams() as { address: string };
  const { api } = useApiContext();
  const { wallet, address: userAddress } = useUserDetailsContext();
  const [polkaApi, setPolkaApi] = useState<ApiPromise | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [AssetHubBalance, setAssetHubBalance] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  const router = useRouter();

  const [tab, setTab] = useState<ETab>(ETab.HOLDINGS);

  const fetchBalance = async () => {
    if (!polkaApi) {
      return;
    }
    try {
      const {
        data: { free: balance },
      } = (await polkaApi.query.system.account(address)) as any;
      setBalance(balance.toString());
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssetHubBalance = async () => {
    if (!api) {
      return;
    }
    try {
      const {
        data: { free: balance },
      } = (await api.query.system.account(address)) as any;
      setAssetHubBalance(balance.toString());
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

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
      const provider = new WsProvider("wss://rpc.polkadot.io");
      const api = await ApiPromise.create({ provider });
      await api.isReady;
      setPolkaApi(api);
    };
    initApi();
  }, []);

  useEffect(() => {
    if (!polkaApi || !api) return;
    fetchBalance();
    fetchAssetHubBalance();
  }, [polkaApi, api]);

  useEffect(() => {
    if (!address) return;
    const getEncodedAddress = (address: string, ss58: number) => {
      try {
        if (address.startsWith("0x")) return address;

        return encodeAddress(address, ss58);
      } catch (e) {
        return null;
      }
    };
    const encodedAddress = getEncodedAddress(address, 0);
    // setIsValidAddress(isAddress(encodedAddress));
  }, [address]);
  //   check if address is valid
  if (!address) {
    return <div>Invalid address</div>;
  }

  return (
    <div className="py-6 font-Agrandir">
      <div className="flex w-full justify-center mb-6">
        <SecondaryButton
          onClick={() => router.back()}
          className="sm:text-[24px] text-[20px]"
        >
          go back
        </SecondaryButton>
      </div>

      <div className="flex justify-center items-center gap-x-3">
        <Button
          onClick={() => setTab(ETab.HOLDINGS)}
          className={`${tab === ETab.HOLDINGS ? "bg-primary text-black" : "bg-transparent text-white"} p-2 text-[16px] font-bold border-none`}
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
  );
}

export default Profile;
