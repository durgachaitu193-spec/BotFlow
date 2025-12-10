import { ApiPromise } from "@polkadot/api";
import { SignerOptions, SubmittableExtrinsic } from "@polkadot/api/types";

import { Dispatch, SetStateAction } from "react";

export enum Wallet {
  POLKADOT = "polkadot-js",
  SUBWALLET = "subwallet-js",
  TALISMAN = "talisman",
  NOVAWALLET = "nova",
  MetaMask = "metamask",
  NotConnected = "not-connected",
}

export enum Network {
  ASSESTHUB_POLKADOT = "assethub-polkadot",
  ASSESTHUB_ROCOCO = "assethub-rococo",
  ASSESTHUB_WESTEND = "assethub-westend",
  BNB = "bnb",
}

export interface ApiContextType {
  api?: ApiPromise;
  apiReady: boolean;
  network: Network;
  setNetwork: Dispatch<SetStateAction<Network>>;
}

export type NetworkProperties = {
  key: Network;
  blockTime: number;
  logoUrl: string;
  ss58Format: number;
  tokenDecimals: number;
  tokenSymbol: string;
  rpcEndpoint: string;
  name: string; // to store alphabetical case
  disabled: boolean;
  blockExplorerUrl: string;
};

export type NetworkConstants = {
  [index: string]: NetworkProperties;
};

export interface ISubstrateExecuteProps {
  api: ApiPromise;
  apiReady: boolean;
  network: string;
  tx: SubmittableExtrinsic<"promise">;
  address: string;
  params?: Partial<SignerOptions>;
  onSuccess: (
    blockHash: string,
    txIndex: string,
    txHash: string,
  ) => Promise<void> | void;
  onFailed: (errorMessageFallback: string) => Promise<void> | void;
  onBroadcast?: () => void;
  setStatus?: (pre: string) => void;
}

export interface IToken {
  id: string;
  name: string;
  symbol: string;
  supply: string;
  description: string;
  mnemonic: string;
  createdBy: string;
  created: Date;
  updated: Date;
  logo: string;
  twitter?: string;
  telegram?: string;
  website?: string;
  substrateAddress: string;
  ethereumAddress: string;
  reserveBalance: string;
  tradeDisabled?: boolean;
  hydradxId?: string;
}

export interface IUser {
  address: string;
  wallet: Wallet;
}

export enum CLIENT_DB_COLLECTIONS {
  CLIENT_TOKENS = "clientTokens",
  TRANSACTIONS = "transactions",
  TOKEN_HOLDINGS = "tokenHoldings",
}

export interface ITransaction {
  txHash: string;
  tokenId: string;
  userAddressTxHash: string;
  symbol: string;
  amount: string;
  value: string;
  currentPrice: string;
  type: string;
  from: string;
  to: string;
  createdAt: string | Date | { seconds: number };
  supply: string;
}

export interface IChartData {
  x: string;
  y: string;
}
