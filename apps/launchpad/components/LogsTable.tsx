"use client";

import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import clsx from "clsx";
import { getTransactions, Transaction } from "@/actions/getTransactions";
import { formatDistanceToNow } from "date-fns";

export default function LogsTable() {
  const [logs, setLogs] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await getTransactions();
        console.log("LogsTable: Fetched data", data);
        setLogs(data);
      } catch (error) {
        console.error("Failed to fetch logs", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-2xl border border-white/5 bg-bg-card p-6">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">
          Recent Activity
        </h3>
        <button className="flex items-center gap-2 rounded-lg border border-white/10 bg-bg-surface px-3 py-1.5 text-sm text-text-secondary hover:text-white transition-colors">
          <Filter className="h-4 w-4" />
          Filter
        </button>
      </div>

      <div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/5 text-text-muted">
              <th className="pb-3 font-medium">Agent</th>
              <th className="pb-3 font-medium">Action</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="py-4 text-center text-text-muted">
                  Loading activity...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-4 text-center text-text-muted">
                  No recent activity
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.txHash} className="group">
                  <td className="py-4 font-medium text-text-primary group-hover:text-accent-primary transition-colors">
                    {log.symbol}
                  </td>
                  <td className="py-4 text-text-secondary">
                    <span
                      className={
                        log.type === "buy"
                          ? "text-status-success"
                          : "text-status-error"
                      }
                    >
                      {log.type === "buy" ? "Bought" : "Sold"}
                    </span>{" "}
                    {Number(log.amount).toLocaleString()} {log.symbol}
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-status-success" />
                      <span className="capitalize text-status-success">
                        Success
                      </span>
                    </div>
                  </td>
                  <td className="py-4 text-right text-text-muted">
                    {formatDistanceToNow(new Date(log.createdAt), {
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
