"use client";

import React from "react";
import { Search, Bell, ChevronDown, Menu } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { useApp } from "@/context/AppContext";
import clsx from "clsx";
import { BUILDER_URL, LAUNCHPAD_URL } from "@/global/constants";

interface NavbarProps {
  onMenuClick?: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { login, logout, authenticated, user, ready } = usePrivy();
  const { currentApp, setApp } = useApp();

  console.log("Navbar: Privy ready:", ready, "Authenticated:", authenticated);

  return (
    <header className="sticky top-16 z-30 flex h-16 w-full items-center justify-between border-b border-white/5 bg-bg-deep/80 px-4 md:px-6 backdrop-blur-md">
      <div className="flex items-center gap-4 md:gap-6">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 text-text-muted hover:text-text-primary focus:outline-none"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 rounded-lg border border-white/5 bg-white/5 p-1">
        <button
          onClick={() => {
            if (currentApp !== "launchpad") {
              // setApp("launchpad");
              window.location.href = LAUNCHPAD_URL;
            }
          }}
          className={clsx(
            "rounded-md px-3 md:px-4 py-1.5 text-xs md:text-sm font-medium transition-colors",
            currentApp === "launchpad"
              ? "bg-accent-primary/10 text-accent-primary"
              : "text-text-muted hover:text-text-primary",
          )}
        >
          Launchpad
        </button>
        <button
          onClick={() => {
            if (currentApp !== "builder") {
              // setApp("builder");
              window.location.href = `${BUILDER_URL}/workspace`;
            }
          }}
          className={clsx(
            "rounded-md px-3 md:px-4 py-1.5 text-xs md:text-sm font-medium transition-colors",
            currentApp === "builder"
              ? "bg-accent-primary/10 text-accent-primary"
              : "text-text-muted hover:text-text-primary",
          )}
        >
          Builder
        </button>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        <div className="flex items-center gap-3 pl-0 md:pl-6">
          {authenticated ? (
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={logout}
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-accent-primary to-accent-secondary p-[1px]">
                <div className="h-full w-full rounded-full bg-bg-deep p-0.5">
                  <img
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                    alt="User"
                    className="h-full w-full rounded-full bg-bg-surface"
                  />
                </div>
              </div>
              <div className="hidden md:block">
                <div className="text-sm font-medium text-text-primary">
                  {user?.wallet?.address
                    ? `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}`
                    : "User"}
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-text-muted hidden md:block" />
            </div>
          ) : (
            <button
              onClick={() => {
                console.log("Connect button clicked");
                login();
              }}
              disabled={!ready}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-text-primary hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="h-4 w-4 rounded-full bg-white/10 flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-accent-primary" />
              </span>
              <span className="hidden md:inline">
                {!ready ? "Loading..." : "Connect"}
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
