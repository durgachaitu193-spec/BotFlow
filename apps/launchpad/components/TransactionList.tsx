"use client";

import React, { useEffect, useState } from "react";
import { getTransactions, Transaction } from "@/actions/getTransactions";
import { formatDistanceToNow } from "date-fns";
import { ArrowUpRight, ArrowDownLeft, ExternalLink } from "lucide-react";
import { ethers } from "ethers";

interface TransactionListProps {
  tokenId: string;
}

export default function TransactionList({ tokenId }: TransactionListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!tokenId) return;
      setIsLoading(true);
      try {
        const data = await getTransactions(tokenId);
        setTransactions(data);
      } catch (error) {
        console.error("Failed to fetch transactions", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
    const interval = setInterval(fetchTransactions, 10000); // Poll every 10s
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
          Recent Activity
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-text-muted uppercase">
            <tr>
              <th className="pb-3 font-medium">Type</th>
              <th className="pb-3 font-medium">Amount</th>
              <th className="pb-3 font-medium">Value (BNB)</th>
              <th className="pb-3 font-medium">From</th>
              <th className="pb-3 font-medium text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoading && transactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-4 text-center text-text-muted">
                  Loading activity...
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-4 text-center text-text-muted">
                  No recent activity
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr
                  key={tx.txHash}
                  className="group hover:bg-white/5 transition-colors"
                >
                  <td className="py-3">
                    <div
                      className={`flex items-center gap-2 font-medium ${tx.type === "buy" ? "text-status-success" : "text-status-error"}`}
                    >
                      {tx.type === "buy" ? (
                        <ArrowDownLeft className="h-4 w-4" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4" />
                      )}
                      {tx.type === "buy" ? "Buy" : "Sell"}
                    </div>
                  </td>
                  <td className="py-3 font-medium text-white">
                    {Number(tx.amount).toLocaleString()} {tx.symbol}
                  </td>
                  <td className="py-3 text-text-secondary">
                    {Number(ethers.utils.formatEther(tx.value)).toFixed(6)}
                  </td>
                  <td className="py-3">
                    <a
                      href={`https://testnet.bscscan.com/address/${tx.from}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-accent-primary hover:text-accent-primary/80"
                    >
                      {tx.from.slice(0, 4)}...{tx.from.slice(-4)}
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </td>
                  <td className="py-3 text-right text-text-muted">
                    {formatDistanceToNow(new Date(tx.createdAt), {
                      addSuffix: true,
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
