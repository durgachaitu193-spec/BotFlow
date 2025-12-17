"use client";

import React from "react";
import { ChevronDown, Menu } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import clsx from "clsx";
import { WalletButton } from "./WalletButton";

// Constants defined locally or passed as props if they vary significantly
const LAUNCHPAD_URL = "http://localhost:3000"; // Default or Env var
const BUILDER_URL = "http://localhost:3001";   // Default or Env var

export interface NavbarProps {
    onMenuClick?: () => void;
    currentApp?: "launchpad" | "builder" | string;
    onSwitchApp?: (app: "launchpad" | "builder") => void;
    isCollapsed?: boolean;
    onSignOut?: () => Promise<void> | void;
}

export function Navbar({ onMenuClick, currentApp, onSwitchApp, isCollapsed, onSignOut }: NavbarProps) {
    const { authenticated } = usePrivy();

    const handleSwitch = (app: "launchpad" | "builder") => {
        if (onSwitchApp) {
            onSwitchApp(app);
        } else {
            // Fallback default behavior if no handler provided
            if (app === "launchpad") {
                window.location.href = LAUNCHPAD_URL;
            } else {
                window.location.href = `${BUILDER_URL}/workspace`;
            }
        }
    };

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

            <div
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 rounded-lg border border-white/5 bg-white/5 p-1"
                style={{ left: currentApp === "builder" ? (isCollapsed ? "52%" : "46%") : "40%" }}
            >
                <button
                    onClick={() => handleSwitch("launchpad")}
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
                    onClick={() => handleSwitch("builder")}
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
                    {/* Check if onSignOut is properly passed */}
                    <WalletButton onSignOut={onSignOut} />
                </div>
            </div>
        </header>
    );
}
