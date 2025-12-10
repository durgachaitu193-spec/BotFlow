import { ApiPromise } from "@polkadot/api";
import { u8aToHex } from "@polkadot/util";
import { decodeAddress } from "@polkadot/util-crypto";
export type destination = "Here" | "Parachain" | "AccountId32";

interface IAssetRegistration {
  api: ApiPromise;
  account: string;
  tokens: string;
}

export const sendDotToHydration = ({
  api,
  account,
  tokens,
}: IAssetRegistration) => {
  const accountId = u8aToHex(decodeAddress(account));
  const dest = api.createType("MultiLocation", {
    parents: 0,
    interior: {
      X1: {
        Parachain: 2034,
      },
    },
  });

  const beneficiary = api.createType("MultiLocation", {
    parents: 0,
    interior: {
      X1: {
        AccountId32: {
          network: "Any",
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
        Fungible: tokens,
      },
    },
  ];
  return api.tx.xcmPallet.limitedReserveTransferAssets(
    { V2: dest },
    { V2: beneficiary },
    { V2: assets },
    "0",
    "Unlimited",
  );
};
