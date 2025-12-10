"use client";
import React from "react";
import CreateToken from "./components/createToken";
import DashboardLayout from "@/components/DashboardLayout";
import { useRouter } from "next/navigation";

function Board() {
  const router = useRouter();

  return (
    <DashboardLayout>
      <div className="flex py-6 justify-center h-full">
        <CreateToken isOpen={true} onClose={() => router.push("/")} />
      </div>
    </DashboardLayout>
  );
}

export default Board;
