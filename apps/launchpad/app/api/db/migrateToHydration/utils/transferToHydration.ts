import { ApiPromise } from "@polkadot/api";
import { u8aToHex } from "@polkadot/util";
import { decodeAddress } from "@polkadot/util-crypto";
export type destination = "Here" | "Parachain" | "AccountId32";

interface IAssetRegistration {
  api: ApiPromise;
  account: string;
  assetId: string;
  tokens: string;
  extraAsset: boolean;
}

export interface TransferAssetsProps {
  destination?: destination;
  destinationParents?: number | string;
  destinationValue?: number | string;
  beneficiary: destination;
  beneficiaryValue?: string;
  assetParents?: number | string;
  amount: number | string;
  feeAssetItem?: number | string;
  assetId?: number | string;
}

export interface LimitedTransferAssetsProps extends TransferAssetsProps {
  weightLimit?: number | string;
}

export const transferToHydrationTx = ({
  api,
  account,
  assetId,
  tokens,
  extraAsset,
}: IAssetRegistration) => {
  const accountId = u8aToHex(decodeAddress(account));
  const dest = api.createType("MultiLocation", {
    parents: 1,
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
          interior: {
            X2: [{ PalletInstance: "50" }, { GeneralIndex: assetId }],
          },
        },
      },
      fun: {
        Fungible: tokens,
      },
    },
  ];

  if (extraAsset) {
    assets.unshift({
      id: {
        Concrete: {
          parents: "0",
          interior: {
            X2: [{ PalletInstance: "50" }, { GeneralIndex: "1984" }],
          },
        },
      },
      fun: {
        Fungible: "20000",
      },
    });
  }

  return api.tx.polkadotXcm.limitedReserveTransferAssets(
    { V3: dest },
    { V3: beneficiary },
    { V3: assets },
    "0",
    "Unlimited",
  );
};
