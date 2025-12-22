"use client";
import { Menu } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import clsx from "clsx";
import { WalletButton } from "./WalletButton";

// Constants defined locally or passed as props if they vary significantly
const isDev = process.env.NODE_ENV === "development";
const LAUNCHPAD_URL = process.env.NEXT_PUBLIC_LAUNCHPAD_URL || (isDev ? "http://localhost:3000" : "https://launchpad.megalith.run");
const BUILDER_URL = process.env.NEXT_PUBLIC_BUILDER_URL || (isDev ? "http://localhost:3001" : "https://builder.megalith.run");

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
            if (app === "launchpad") {
                window.location.href = LAUNCHPAD_URL;
            } else {
                window.location.href = `${BUILDER_URL}/workspace`;
            }
        }
    };

    return (<header className="sticky top-16 z-30 flex h-16 w-full items-center justify-between border-b border-white/5 bg-bg-deep/80 px-4 md:px-6 backdrop-blur-md">
        <div className="flex items-center gap-4 md:gap-6">
            <button
                onClick={onMenuClick}
                className="md:hidden p-2 -ml-2 text-text-muted hover:text-text-primary focus:outline-none"
            >
                <Menu className="h-6 w-6" />
            </button>
        </div>
        <div className="flex items-center gap-4 md:gap-6">
            <div
                className="flex items-center gap-1 rounded-lg border border-white/5 bg-white/5 p-1"
            >
                <button
                    onClick={() => handleSwitch("launchpad")}
                    disabled={currentApp === "launchpad"}
                    className={clsx(
                        "rounded-md px-3 md:px-4 py-1.5 text-xs md:text-sm font-medium transition-colors",
                        currentApp === "launchpad"
                            ? "bg-accent-primary/10 text-accent-primary cursor-not-allowed opacity-50"
                            : "text-text-muted hover:text-text-primary"
                    )}
                >
                    Launchpad
                </button>

                <span className="text-white/10">|</span>

                <button
                    onClick={() => handleSwitch("builder")}
                    disabled={currentApp === "builder"}
                    className={clsx(
                        "rounded-md px-3 md:px-4 py-1.5 text-xs md:text-sm font-medium transition-colors",
                        currentApp === "builder"
                            ? "bg-accent-primary/10 text-accent-primary cursor-not-allowed opacity-50"
                            : "text-text-muted hover:text-text-primary"
                    )}
                >
                    Builder
                </button>
            </div>
            <div className="flex items-center gap-3 pl-0 md:pl-4 border-l border-white/10">
                <div className="pl-3">
                    <WalletButton onSignOut={onSignOut} />
                </div>
            </div>
        </div>
    </header>

    );
}
