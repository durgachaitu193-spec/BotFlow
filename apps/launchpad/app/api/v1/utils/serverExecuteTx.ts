// Copyright 2019-2025 @blobscriptions/marketplace authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { ApiPromise } from "@polkadot/api";
import { SignerOptions, SubmittableExtrinsic } from "@polkadot/api/types";

interface ISubstrateServerExecuteProps {
  api: ApiPromise;
  apiReady: boolean;
  network: string;
  tx: SubmittableExtrinsic<"promise">;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  address: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onFailed?: () => Promise<any>;
  params?: Partial<SignerOptions>;
}

export const serverExecuteTx = async ({
  api,
  apiReady,
  network,
  tx,
  address,
  onFailed,
  params = {},
}: ISubstrateServerExecuteProps) => {
  if (!api || !apiReady || !tx) {
    console.log("api not ready");
    return;
  }
  let hydxAssetId = "";
  let flag = false;
  return new Promise<{
    status: "success" | "error";
    txHash: string;
    data?: string;
  }>((resolve, reject) => {
    tx.signAndSend(address, params, async ({ status, events, txHash }) => {
      if (status.isInvalid) {
        console.log("Transaction invalid");
      } else if (status.isReady) {
        console.log("Transaction is ready");
      } else if (status.isBroadcast) {
        console.log("Transaction has been broadcasted");
      } else if (status.isInBlock) {
        console.log("Transaction is in block");

        // const blockHash = status.asInBlock.toString();

        for (const { event } of events) {
          if (event.method === "Registered") {
            const [assetId] = event.data;
            hydxAssetId = assetId.toString();
            console.log("Registered asset ID:", assetId.toString());
          }
          if (event.method === "ExtrinsicSuccess") {
            flag = true;
            console.log("Transaction Success");
          } else if (event.method === "ExtrinsicFailed") {
            await onFailed?.();
            console.log("Transaction failed");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const dispatchError = (event.data as any)?.dispatchError;

            if (dispatchError?.isModule) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const errorModule = (event.data as any)?.dispatchError?.asModule;
              const { method, section, docs } =
                api.registry.findMetaError(errorModule);
              const errorMessageFallbackString = `${section}.${method} : ${docs.join(" ")}`;
              console.log(errorMessageFallbackString, "error module");
              reject({
                status: "error",
                message: errorMessageFallbackString + " error module",
              });
            } else if (dispatchError?.isToken) {
              console.log(
                `${dispatchError.type}.${dispatchError.asToken.type}`,
              );
              reject({
                status: "error",
                message: `${dispatchError.type}.${dispatchError.asToken.type}`,
              });
            } else {
              reject({
                status: "error",
                message: `${dispatchError.type}` || "Transaction failed",
              });
            }
          }
        }
      } else if (status.isFinalized) {
        if (flag) {
          resolve({
            status: "success",
            txHash: txHash.toString(),
            data: hydxAssetId,
          });
        }
        console.log(
          `Transaction has been included in blockHash ${status.asFinalized.toHex()}`,
        );
        console.log(`tx: https://${network}.subscan.io/extrinsic/${txHash}`);
      }
    }).catch((error: unknown) => {
      console.log(":( transaction failed");
      console.error("ERROR:", error);
      reject({
        status: "error",
        message: error?.toString?.() || "Error in transaction execution",
      });
    });
  });
};
