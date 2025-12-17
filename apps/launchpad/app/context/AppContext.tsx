"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { useParams } from "next/navigation";
import { ApiContextType, Network } from "@/global/types";
import { networkConstants } from "@/global/networkConstants";
import { CURRENT_NETWORK } from "@/global/constants";
import "@polkadot/api-augment";

type AppMode = "launchpad" | "builder";

interface AppContextType extends ApiContextType {
  currentApp: AppMode;
  setApp: (app: AppMode) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentApp, setCurrentApp] = useState<AppMode>("launchpad");

  // ApiContext logic
  const { network: currNetwork } = useParams() as { network: Network };
  const [api, setApi] = useState<ApiPromise>();
  const [apiReady, setApiReady] = useState(false);
  const [network, setNetwork] = useState<Network>(
    currNetwork || CURRENT_NETWORK,
  );

  const handleApi = useCallback(async () => {
    if (networkConstants[network].isEvm) {
      setApi(undefined);
      setApiReady(true);
      return;
    }
    const provider = new WsProvider(networkConstants[network].rpcEndpoint);
    const apiPromise = new ApiPromise({ provider });
    await apiPromise.isReady;
    setApi(apiPromise);
    setApiReady(true);
  }, [network]);

  useEffect(() => {
    setApiReady(false);
    setApi(undefined);
    handleApi().catch(console.error);
  }, [handleApi]);

  useEffect(() => {
    if (currentApp === "launchpad") {
      document.body.setAttribute("data-theme", "launchpad");
    } else {
      document.body.removeAttribute("data-theme");
    }
  }, [currentApp]);

  const value = useMemo(
    () => ({
      currentApp,
      setApp: setCurrentApp,
      api,
      apiReady,
      network,
      setNetwork,
    }),
    [currentApp, api, apiReady, network],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
