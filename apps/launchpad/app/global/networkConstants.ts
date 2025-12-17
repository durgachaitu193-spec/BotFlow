// Copyright 2019-2025 @blobscriptions/marketplace authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { Network, NetworkConstants } from "@/global/types";

export const networkConstants: NetworkConstants = {
  [Network.ASSESTHUB_POLKADOT]: {
    disabled: false,
    key: Network.ASSESTHUB_POLKADOT,
    name: "Polkadot",
    blockTime: 6000,
    logoUrl: "/parachain-logos/avail.png",
    ss58Format: 0,
    tokenDecimals: 10,
    tokenSymbol: "DOT",
    blockExplorerUrl: "https://assethub-rococo.subscan.io/",
    rpcEndpoint: "wss://polkadot-asset-hub-rpc.polkadot.io",
  },
  [Network.ASSESTHUB_ROCOCO]: {
    disabled: false,
    key: Network.ASSESTHUB_ROCOCO,
    name: "Rococo",
    blockTime: 6000,
    logoUrl: "/parachain-logos/eclipse.png",
    ss58Format: 42,
    tokenDecimals: 12,
    tokenSymbol: "ROC",
    blockExplorerUrl: "https://assethub-rococo.subscan.io/",
    rpcEndpoint: "wss://asset-hub-rococo-rpc.dwellir.com",
  },
  [Network.ASSESTHUB_WESTEND]: {
    disabled: false,
    key: Network.ASSESTHUB_WESTEND,
    name: "Westend",
    blockTime: 6000,
    logoUrl: "/parachain-logos/eclipse.png",
    ss58Format: 42,
    tokenDecimals: 12,
    tokenSymbol: "ROC",
    blockExplorerUrl: "https://assethub-rococo.subscan.io/",
    rpcEndpoint: "wss://westend-asset-hub-rpc.polkadot.io",
  },
  [Network.BNB]: {
    disabled: false,
    key: Network.BNB,
    name: "Binance Smart Chain",
    blockTime: 6000,
    logoUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSPVQl3k2_pnTREpCeAXPyB5wxktuUPXjmBoQ&s",
    ss58Format: 42,
    tokenDecimals: 18,
    tokenSymbol: "BNB",
    blockExplorerUrl: "https://bscscan.com/",
    rpcEndpoint: "wss://bsc-rpc.publicnode.com",
  },
};
