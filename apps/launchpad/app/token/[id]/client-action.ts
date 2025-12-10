/* eslint-disable @typescript-eslint/no-explicit-any */
import { FEE_ADDRESS, SWAP_FEE } from "@/global/constants";
import { IToken } from "@/global/types";
import { executeTx } from "@/global/utils/executeTx";
import { nextApiFetch } from "@/global/utils/nextApiFetch";
import {
  calculateTotalCost,
  calculateTotalSellingCost,
  SCALING_FACTOR,
} from "@/lib/bounding-curve";
import { ApiPromise } from "@polkadot/api";
import { BN } from "@polkadot/util";

export const getToken = async ({
  id,
}: {
  id: string;
}): Promise<{
  data?: { token: IToken };
  error?: string;
}> => {
  return nextApiFetch({
    url: `api/v1/token/${id}`,
    method: "GET",
  });
};

export const buyToken = async ({
  id,
  amount,
  api,
  address,
  recipient,
  network,
  setStatus,
  setLoading,
}: {
  id: string;
  amount: BN;
  api: ApiPromise;
  address: string;
  recipient: string;
  network: string;
  setStatus: (status: string) => void;
  setLoading: (loading: boolean) => void;
}) => {
  const { data } = await getToken({ id });
  if (!data) {
    console.log("Token not found");
    return null;
  }
  const { supply, reserveBalance } = data.token;
  const transferMoney = calculateTotalCost(
    new BN(supply),
    amount,
    new BN(reserveBalance),
  ).cost;
  const mainTx = api.tx.assets.transfer(
    id,
    address,
    amount.mul(SCALING_FACTOR),
  );

  const { partialFee } = await mainTx.paymentInfo(recipient);
  const buyTx = api.tx.balances.transferKeepAlive(
    recipient,
    transferMoney.add(new BN(partialFee.toJSON())).toString(),
  );
  const feeTx = api.tx.balances.transferKeepAlive(
    FEE_ADDRESS,
    SWAP_FEE.toString(),
  );

  const tx = api.tx.utility.batchAll([feeTx, buyTx]);

  return new Promise((resolve, reject) => {
    // transfer money to the token substrate address
    const onSuccess = async (
      blockHash: string,
      txIndex: string,
      txHash: string,
    ) => {
      // call BuyToken API
      try {
        console.log("Tx Block details:", blockHash, txIndex, txHash);
        await nextApiFetch({
          url: "api/v1/swap/buy",
          method: "POST",
          data: {
            blockHash,
            txIndex,
            address,
            txHash,
            id,
            amount: amount.toString(),
          },
        });
        setLoading(false);
        resolve(true);
      } catch (error: any) {
        reject(error);
        throw new Error(error);
      }
    };

    const onFailed = (message: string) => {
      // queue notification failed
      setLoading(false);
      reject(message);
      throw new Error(message);
    };

    executeTx({
      api,
      apiReady: true,
      address,
      network,
      tx,
      setStatus,
      onSuccess,
      onFailed,
    });
  });
};

export const sellToken = async ({
  id,
  amount,
  api,
  address,
  recipient,
  network,
  setStatus,
  setLoading,
}: {
  id: string;
  amount: BN;
  api: ApiPromise;
  address: string;
  recipient: string;
  network: string;
  setStatus: (status: string) => void;
  setLoading: (loading: boolean) => void;
}) => {
  const { data } = await getToken({ id });
  if (!data) {
    console.log("Token not found");
    return null;
  }
  const { supply, reserveBalance } = data.token;
  const transferMoney = calculateTotalSellingCost(
    new BN(supply),
    amount,
    new BN(reserveBalance),
  ).cost;
  const mainTx = api.tx.balances.transferKeepAlive(address, transferMoney);
  const { partialFee } = await mainTx.paymentInfo(recipient);
  const txFeeTx = api.tx.balances.transferKeepAlive(
    recipient,
    new BN(partialFee.toJSON()).toString(),
  );
  const feeTx = api.tx.balances.transferKeepAlive(
    FEE_ADDRESS,
    SWAP_FEE.toString(),
  );
  const assetTransferTx = api.tx.assets.transfer(
    id,
    recipient,
    amount.mul(SCALING_FACTOR),
  );
  const tx = api.tx.utility.batchAll([feeTx, txFeeTx, assetTransferTx]);

  return new Promise((resolve, reject) => {
    // transfer money to the token substrate address
    const onSuccess = async (
      blockHash: string,
      txIndex: string,
      txHash: string,
    ) => {
      // call BuyToken API
      try {
        await nextApiFetch({
          url: "api/v1/swap/sell",
          method: "POST",
          data: {
            blockHash,
            txIndex,
            address,
            txHash,
            id,
            amount: amount.toString(),
          },
        });
        setLoading(false);
        resolve(true);
      } catch (error: any) {
        throw new Error(error);
      }
    };

    const onFailed = (error: string) => {
      setLoading(false);
      reject(error);
      throw new Error(error);
    };

    executeTx({
      api,
      apiReady: true,
      address,
      network,
      tx,
      setStatus,
      onSuccess,
      onFailed,
    });
  });
};
