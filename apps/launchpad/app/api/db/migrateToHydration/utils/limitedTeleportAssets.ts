import { ApiPromise } from "@polkadot/api";
import { u8aToHex } from "@polkadot/util";
import { decodeAddress } from "@polkadot/util-crypto";
export type destination = "Here" | "Parachain" | "AccountId32";

interface IAssetRegistration {
  api: ApiPromise;
  account: string;
  tokens: string;
}

export const limitedTeleportAssets = ({
  api,
  account,
  tokens,
}: IAssetRegistration) => {
  const accountId = u8aToHex(decodeAddress(account));

  // Construct the XCM message
  const tx = api.tx.polkadotXcm.limitedTeleportAssets(
    { V3: { parents: 1, interior: "Here" } },
    {
      V3: {
        parents: 0,
        interior: {
          X1: {
            AccountId32: {
              id: api.createType("AccountId32", accountId).toHex(),
            },
          },
        },
      },
    },
    {
      V3: [
        {
          id: { Concrete: { parents: 1, interior: "Here" } },
          fun: { Fungible: tokens },
        },
      ],
    }, // assets
    "0",
    "Unlimited",
  );

  return tx;
};
