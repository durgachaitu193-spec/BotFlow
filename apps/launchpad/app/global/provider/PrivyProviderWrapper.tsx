"use client";

import React from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { BSC_MAINNET, BSC_TESTNET } from "../../../lib/chains";

export default function PrivyProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!privyAppId) {
    console.warn(
      "NEXT_PUBLIC_PRIVY_APP_ID is not set. Privy authentication will not work.",
    );
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        loginMethods: ["wallet"],
        appearance: {
          theme: "dark",
          accentColor: "#0EE0C6",
          logo: process.env.NEXT_PUBLIC_APP_URL
            ? `${process.env.NEXT_PUBLIC_APP_URL}/logo/lockup_ow.png`
            : undefined,
          showWalletLoginFirst: true,
          landingHeader: "MegalithLabs",
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
        supportedChains: [BSC_TESTNET, BSC_MAINNET],
      }}
    >
      {children}
    </PrivyProvider>
  );
}
