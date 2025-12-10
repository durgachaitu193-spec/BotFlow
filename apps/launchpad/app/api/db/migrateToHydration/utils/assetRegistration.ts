import { ApiPromise } from "@polkadot/api";

interface IAssetRegistration {
  api: ApiPromise;
  assetId: string;
}

export const assetRegistration = ({ api, assetId }: IAssetRegistration) => {
  // register Asset to HydraDX
  const location = {
    parents: 1,
    interior: {
      X3: [
        { Parachain: 1000 },
        { PalletInstance: 50 },
        { GeneralIndex: Number(assetId) },
      ],
    },
  };

  const multiLocation = api.createType("MultiLocation", location);
  const tx = api.tx.assetRegistry.registerExternal(multiLocation);
  return tx;
};
