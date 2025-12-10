"use client";

import React from "react";
import Sidebar from "@/components/Sidebar";
import LaunchpadNavbar from "@/components/LaunchpadNavbar";
import { motion } from "framer-motion";
import Navbar from "./Navbar";
import CreateToken from "@/create/components/createToken";
import clsx from "clsx";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-bg-deep text-text-primary">
      <LaunchpadNavbar />
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
            // Desktop: adjust padding based on collapsed state
            "md:pl-64",
            isCollapsed && "md:!pl-20",
            // Mobile: no padding as sidebar is overlay
            "pl-0",
          )}
        >
          <Navbar onMenuClick={() => setIsMobileMenuOpen(true)} />
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
