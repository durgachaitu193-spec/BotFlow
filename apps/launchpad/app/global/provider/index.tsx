"use client";
import React from "react";
import { ReactNode } from "react";
import { UserDetailsProvider } from "@/context/UserDetailContext";
import { AppProvider } from "@/context/AppContext";
import PrivyProviderWrapper from "./PrivyProviderWrapper";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <PrivyProviderWrapper>
      <AppProvider>
        <UserDetailsProvider>{children}</UserDetailsProvider>
      </AppProvider>
    </PrivyProviderWrapper>
  );
}
