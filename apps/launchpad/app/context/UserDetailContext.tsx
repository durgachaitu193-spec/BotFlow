"use client";

import { Wallet } from "@/global/types";
import React, {
  createContext,
  useMemo,
  useState,
  useEffect,
  useRef,
} from "react";
import { usePrivy } from "@privy-io/react-auth";

interface UserDetailsContextType {
  address: string;
  wallet: Wallet;
  userId: string | null;
  setUserDetails: React.Dispatch<
    React.SetStateAction<{
      address: string;
      wallet: Wallet;
      userId: string | null;
    }>
  >;
}

export const UserDetailsContext = createContext<UserDetailsContextType>(
  {} as UserDetailsContextType,
);

// Transform Privy user to match expected format
const transformPrivyUser = (privyUser: any) => {
  return {
    privyId: privyUser.id,
    createdAt: privyUser.createdAt,
    updatedAt: privyUser.updatedAt,
    linkedAccounts: privyUser.linkedAccounts,
    wallet: privyUser.wallet,
    metadata: privyUser.metadata || {},
  };
};

export function UserDetailsProvider({
  children,
}: React.PropsWithChildren<object>) {
  const { user, authenticated } = usePrivy();
  const hasSynced = useRef(false);

  const [userDetails, setUserDetails] = useState({
    address: "",
    wallet: "" as Wallet,
    userId: null as string | null,
  });

  // Sync user with database and update wallet details when authenticated
  useEffect(() => {
    // Reset sync flag when user logs out
    if (!authenticated || !user) {
      hasSynced.current = false;
      setUserDetails({
        address: "",
        wallet: "" as Wallet,
        userId: null,
      });
      return;
    }

    // Update wallet details immediately
    // Get wallet from linkedAccounts (filter for wallet type accounts)
    const linkedWallet = user.linkedAccounts?.find(
      (account) => account.type === "wallet",
    ) as any;
    const walletAddress = user.wallet?.address || linkedWallet?.address;
    const walletType = (user.wallet?.walletClientType ||
      linkedWallet?.walletClientType) as Wallet;

    if (walletAddress) {
      setUserDetails((prev) => ({
        ...prev,
        address: walletAddress,
        wallet: walletType,
      }));
    }

    // Sync user with database (only once per login)
    if (hasSynced.current) {
      return;
    }

    const syncUser = async () => {
      try {
        hasSynced.current = true;

        const privyUserData = transformPrivyUser(user);

        const response = await fetch("/api/auth/privy/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user: privyUserData,
            walletAddress,
          }),
        });

        if (response.ok) {
          const data = await response.json();

          // Update with database user ID
          setUserDetails((prev) => ({
            ...prev,
            userId: data.user?.id || null,
          }));
        } else {
          console.error("Failed to sync user:", await response.text());
          hasSynced.current = false; // Allow retry on error
        }
      } catch (error) {
        console.error("Error syncing user:", error);
        hasSynced.current = false; // Allow retry on error
      }
    };

    syncUser();
  }, [authenticated, user]);

  const providerValue = useMemo(
    () => ({
      address: userDetails.address,
      wallet: userDetails.wallet,
      userId: userDetails.userId,
      setUserDetails,
    }),
    [userDetails],
  );

  return (
    <UserDetailsContext.Provider value={providerValue}>
      {children}
    </UserDetailsContext.Provider>
  );
}
