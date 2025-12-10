"use client";

import React, { useEffect, useState } from "react";
import { getHolders, Holder } from "@/actions/getHolders";

interface HoldersListProps {
  tokenId?: string;
}

export default function HoldersList({ tokenId }: HoldersListProps) {
  const [holders, setHolders] = useState<Holder[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchHolders = async () => {
      if (!tokenId) return;
      setIsLoading(true);
      try {
        const data = await getHolders(tokenId);
        setHolders(data);
      } catch (error) {
        console.error("Failed to fetch holders", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHolders();
    // Poll every 30 seconds?
    const interval = setInterval(fetchHolders, 30000);
    return () => clearInterval(interval);
  }, [tokenId]);

  if (!tokenId) return null;

  return (
    <div
      className="rounded-xl border border-white/5 bg-bg-card p-6"
      style={{
        background:
          "linear-gradient(360deg, rgba(0, 255, 243, 0.31) 0%, rgba(0, 0, 0, 0.31) 55.98%)",
        border: "1px solid rgba(0, 249, 207, 0.3)",
        backdropFilter: "blur(92px)",
        boxShadow: "0px 4px 4px 0px rgba(0, 0, 0, 0.25)",
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
          Top Holders
        </h3>
        <button className="text-xs text-accent-primary hover:text-accent-primary/80">
          Generate bubble map
        </button>
      </div>
      <div className="space-y-1">
        {isLoading && holders.length === 0 ? (
          <div className="text-center text-text-muted text-xs py-4">
            Loading holders...
          </div>
        ) : holders.length === 0 ? (
          <div className="text-center text-text-muted text-xs py-4">
            No holders found
          </div>
        ) : (
          holders.map((holder, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded px-2 py-1.5 text-sm transition-colors hover:bg-white/5"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`font-mono text-xs ${holder.isBondingCurve ? "text-blue-400" : "text-text-secondary"}`}
                >
                  {holder.address.slice(0, 4)}...{holder.address.slice(-4)}
                </span>
                {holder.isBondingCurve && <span>💧</span>}
              </div>
              <div className="font-medium text-white">{holder.percentage}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
