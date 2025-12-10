"use client";

import { useApiContext, useUserDetailsContext } from "@/context";
import LoginModal from "@/global/Modals/LoginModal";
import { executeTx } from "@/global/utils/executeTx";
import { formatBnBalance } from "@/global/utils/formatBnBalance";
import { getEncodedAddress } from "@/global/utils/getEncodedAddress";
import setSigner from "@/global/utils/setSigner";
import Address from "@/ui-components/Address";
import Loader from "@/ui-components/Loader";
import PrimaryButton from "@/ui-components/PrimaryButton";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { u8aToHex } from "@polkadot/util";
import { decodeAddress } from "@polkadot/util-crypto";
import { Input, Skeleton, Spin } from "antd";
import React, { useEffect, useState } from "react";
import BN from "bn.js";
import inputToBn from "@/global/utils/inputToBn";
import queueNotification, {
  NotificationStatus,
} from "@/ui-components/QueueNotifications";

const Teleport = () => {
  const { api, apiReady, network } = useApiContext();
  const { address, wallet } = useUserDetailsContext();

  const [openModal, setOpenModal] = useState(false);

  const [polkaApi, setPolkaApi] = useState<ApiPromise | null>(null);
  const [polkaApiReady, setPolkaApiReady] = useState<boolean>(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [assetHubBalance, setAssetHubBalance] = useState<string | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [polkaApiLoading, setPolkaApiLoading] = useState<boolean>(false);
  const [teleportLoading, setTeleportLoading] = useState<boolean>(false);

  const [value, setValue] = useState<string>("");

  const [valueBN, setValueBN] = useState<BN>(new BN("0"));

  const fetchBalance = async () => {
    if (!polkaApi) {
      return;
    }
    try {
      setLoading(true);
      const {
        data: { free: balance },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } = (await polkaApi.query.system.account(address)) as any;
      setBalance(balance.toString());
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssetHubBalance = async () => {
    if (!api || !apiReady) {
      return;
    }
    try {
      setLoading(true);
      const {
        data: { free: balance },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } = (await api.query.system.account(address)) as any;
      setAssetHubBalance(balance.toString());
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initApi = async () => {
      const provider = new WsProvider("wss://rpc.polkadot.io");
      setPolkaApiLoading(true);
      const a = await ApiPromise.create({ provider });
      const isReady = await a.isReady;
      if (isReady) {
        setPolkaApi(a);
        setPolkaApiReady(true);
      }
      setPolkaApiLoading(false);
    };
    initApi();
  }, []);

  useEffect(() => {
    if (!polkaApi || !polkaApiReady) return;
    fetchBalance();
  }, [polkaApi, polkaApiReady]);

  useEffect(() => {
    if (!api || !apiReady) return;
    fetchAssetHubBalance();
  }, [api, apiReady]);

  const onAmountChange = (a: string) => {
    const amount = Number(a);
    if (Number.isNaN(amount)) return;
    if (!amount || amount <= 0) {
      return;
    }

    const [inputBalance, isValid] = inputToBn(`${amount}`, network, false);

    if (isValid) {
      setValueBN(inputBalance);
    }
  };

  const teleport = async () => {
    if (!polkaApi || !address || !value) return;

    setTeleportLoading(true);

    const accountId = u8aToHex(decodeAddress(address));

    const dest = polkaApi.createType("MultiLocation", {
      parents: 0,
      interior: {
        X1: {
          Parachain: 1000,
        },
      },
    });

    const beneficiary = polkaApi.createType("MultiLocation", {
      parents: 0,
      interior: {
        X1: {
          AccountId32: {
            network: null,
            id: accountId,
          },
        },
      },
    });

    const assets = [
      {
        id: {
          Concrete: {
            parents: "0",
            interior: "Here",
          },
        },
        fun: {
          Fungible: valueBN.toString(),
        },
      },
    ];

    const tx = polkaApi.tx.xcmPallet.limitedTeleportAssets(
      { V2: dest },
      { V2: beneficiary },
      { V2: assets },
      "0",
      "Unlimited",
    );
    setSigner(polkaApi, wallet, address);
    await executeTx({
      api: polkaApi,
      apiReady: true,
      network: "polkadot",
      tx,
      address,
      onSuccess: async () => {
        queueNotification({
          header: "Success!",
          message: "Tokens Teleported to Assethub",
          status: NotificationStatus.SUCCESS,
        });
        setTeleportLoading(false);
        setValue("");
        setValueBN(new BN("0"));
        await fetchBalance();
        await fetchAssetHubBalance();
      },
      onFailed: () => {
        queueNotification({
          header: "Failed!",
          message: "Error in Teleport, Please try again or Refresh.",
          status: NotificationStatus.ERROR,
        });
        setTeleportLoading(false);
      },
    });
  };

  const formattedPolkadotBalance = formatBnBalance(
    balance || "0",
    { numberAfterComma: 2, withThousandDelimitor: false },
    network,
  );

  return (
    <Spin spinning={teleportLoading}>
      <LoginModal open={openModal} onClose={() => setOpenModal(false)} />
      {!address ? (
        <div className="w-full flex items-center justify-center">
          <PrimaryButton
            onClick={() => {
              setOpenModal(true);
            }}
            className="bg-accent-primary shadow-accent-primary/50"
          >
            Connect Wallet
          </PrimaryButton>
        </div>
      ) : polkaApiLoading ? (
        <Loader />
      ) : (
        <div className="flex flex-col w-full items-center gap-y-4">
          <Address
            startChars={6}
            endChars={6}
            address={getEncodedAddress(address, network) || address}
          />
          <div className="flex items-center gap-x-1 w-full">
            <span>Assethub Balance:</span>{" "}
            {loading ? (
              <Skeleton
                className="w-[100px] flex items-center m-0"
                paragraph={{ rows: 0, width: 2 }}
                active
              />
            ) : (
              formatBnBalance(
                assetHubBalance || "0",
                { withUnit: true, numberAfterComma: 2 },
                network,
              )
            )}
          </div>
          <div className="w-full">
            <p className="text-white mb-2 flex items-center gap-x-1">
              Polkadot{" "}
              {loading ? (
                <Skeleton
                  className="w-[100px] flex items-center m-0"
                  paragraph={{ rows: 0, width: 2 }}
                  active
                />
              ) : (
                <>
                  (max:{" "}
                  {formatBnBalance(
                    balance || "0",
                    { withUnit: true, numberAfterComma: 2 },
                    network,
                  )}
                  )
                </>
              )}
            </p>
            <Input
              disabled={teleportLoading}
              placeholder="10 BNB"
              className={`border-white rounded-[30px] text-white placeholder:text-placeholder bg-transparent px-4 py-2`}
              value={value}
              type="number"
              suffix={"BNB"}
              onChange={(e) => {
                if (Number(e.target.value) >= 0) {
                  onAmountChange(e.target.value);
                  setValue(e.target.value);
                }
              }}
            />
          </div>

          <PrimaryButton
            loading={teleportLoading}
            disabled={
              !value ||
              Number(value) === 0 ||
              Number(value) > Number(formattedPolkadotBalance)
            }
            className="bg-[#5030DB] shadow-[#8952F5] mt-4"
            onClick={teleport}
          >
            Teleport
          </PrimaryButton>
        </div>
      )}
    </Spin>
  );
};

export default Teleport;
