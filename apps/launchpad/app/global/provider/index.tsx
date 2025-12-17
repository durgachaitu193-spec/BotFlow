"use client";

import { ReactNode } from "react";
import { UserDetailsProvider } from "@/context/UserDetailContext";
import { AppProvider } from "@/context/AppContext";
import { PrivyProviderWrapper } from "@sim/ui";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <PrivyProviderWrapper>
      <AppProvider>
        <UserDetailsProvider>{children}</UserDetailsProvider>
      </AppProvider>
    </PrivyProviderWrapper>
  );
}
