"use client";

import React from "react";
import Sidebar from "@/components/Sidebar";
import { LaunchpadNavbar, type LaunchpadNavbarProps } from "@sim/ui";
import CreateToken from "@/create/components/createToken";
import clsx from "clsx";

interface DashboardLayoutProps extends LaunchpadNavbarProps {
  children: React.ReactNode;
}

export default function DashboardLayout({
  children,
  currentApp = "launchpad",
  onSwitchApp,
  onSignOut
}: DashboardLayoutProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-bg-deep text-text-primary">
      <LaunchpadNavbar
        currentApp={currentApp || "launchpad"}
        onSwitchApp={onSwitchApp}
        onSignOut={onSignOut}
      />
      <div className="flex flex-1 relative">
        <Sidebar
          isCollapsed={isCollapsed}
          toggleSidebar={() => setIsCollapsed(!isCollapsed)}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          onCreateClick={() => setIsCreateModalOpen(true)}
        />
        <div
          className={clsx(
            "flex flex-1 flex-col transition-all duration-300 ease-in-out",
            "md:pl-64",
            isCollapsed && "md:!pl-20",
            "pl-0",
          )}
        >
          <main className="flex-1 p-4 md:p-6 overflow-x-hidden w-full">
            {children}
          </main>
        </div>
      </div>
      <CreateToken
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
