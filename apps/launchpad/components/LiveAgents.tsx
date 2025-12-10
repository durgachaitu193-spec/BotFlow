"use client";

import React from "react";
import { motion } from "framer-motion";
import { Clock, Radio } from "lucide-react";
import Link from "next/link";

import { agents } from "@/lib/agentsData";

const liveAgents = agents.filter((agent) =>
  ["Tyga", "REPPO", "Nuna"].includes(agent.name),
);

interface LiveAgentsProps {
  limit?: number;
  showHeader?: boolean;
  className?: string;
}

export default function LiveAgents({
  limit,
  showHeader = true,
  className = "",
}: LiveAgentsProps) {
  const displayAgents = limit ? liveAgents.slice(0, limit) : liveAgents;

  return (
    <div className={`w-full ${className}`}>
      {showHeader && (
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-bold text-text-primary">Live Agents</h3>
          <button className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-text-primary hover:bg-white/10">
            Create Agent
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-2">
        {displayAgents.map((agent, index) => (
          <Link href={`/agent/${agent.id}`} key={agent.id} className="block">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group relative overflow-hidden rounded-2xl border border-white/5 bg-bg-card transition-all hover:border-accent-primary/30 hover:shadow-glow-primary"
            >
              <div className="relative h-48 w-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-bg-card to-transparent z-10" />
                <img
                  src={agent.image}
                  alt={agent.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute left-4 top-4 z-20">
                  {agent.status === "live" ? (
                    <div className="flex items-center gap-1 rounded-full bg-status-success/20 px-2 py-1 text-xs font-medium text-status-success backdrop-blur-md">
                      <Radio className="h-3 w-3 animate-pulse" />
                      LIVE
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 rounded-full bg-accent-secondary/20 px-2 py-1 text-xs font-medium text-accent-secondary backdrop-blur-md">
                      <Clock className="h-3 w-3" />
                      UPCOMING
                    </div>
                  )}
                </div>
              </div>

              <div className="p-5">
                <div className="mb-2 flex items-center gap-2">
                  <h4 className="text-lg font-bold text-white">{agent.name}</h4>
                  <div className="h-4 w-4 rounded-full bg-accent-primary/20 p-0.5">
                    <div className="h-full w-full rounded-full bg-accent-primary" />
                  </div>
                </div>
                <p className="mb-4 line-clamp-2 text-sm text-text-secondary">
                  {agent.description}
                </p>

                <div className="rounded-xl bg-bg-surface p-3 text-center">
                  <div className="text-xs text-text-muted mb-1">
                    {agent.status === "live" ? "Ends in" : "Starts in"}
                  </div>
                  <div className="font-mono text-sm font-medium text-text-primary">
                    {agent.timeLeft}
                  </div>
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
