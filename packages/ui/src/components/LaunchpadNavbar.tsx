"use client";

import React from "react";

export interface LaunchpadNavbarProps {
    currentApp?: "launchpad" | "builder" | string;
}

export function LaunchpadNavbar({ currentApp }: LaunchpadNavbarProps) {
    // Dynamic background color based on current app
    const bgColor =
        currentApp === "launchpad"
            ? "rgba(0, 249, 207, 0.16)"
            : "rgba(255, 111, 0, 0.16)";

    return (
        <header
            className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-white/5 px-6 backdrop-blur-md"
            style={{ backgroundColor: bgColor }}
        >
            <div className="flex items-center gap-6">
                <img
                    src="/logo/lockup_ow.png"
                    alt="Megalith Labs"
                    className="h-4 w-auto"
                />
            </div>
        </header>
    );
}
