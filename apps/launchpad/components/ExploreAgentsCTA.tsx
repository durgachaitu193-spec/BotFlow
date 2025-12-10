"use client";

import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, ArrowRight, Sparkles, User } from "lucide-react";
import Link from "next/link";

import { agents } from "@/lib/agentsData";

const marqueeAgents = agents.filter((agent) =>
  ["Tyga", "REPPO", "Nuna", "Kora", "Zen", "Flux", "Echo", "Nova"].includes(
    agent.name,
  ),
);

const MarqueeCard = ({ agent }: { agent: (typeof agents)[0] }) => (
  <div className="flex w-64 flex-shrink-0 items-center gap-3 rounded-xl border border-white/5 bg-bg-card/50 p-3 backdrop-blur-sm transition-all hover:border-accent-primary/30 hover:bg-bg-card">
    <div className="h-10 w-10 overflow-hidden rounded-full bg-bg-surface">
      <img
        src={agent.image}
        alt={agent.name}
        className="h-full w-full object-cover"
      />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between">
        <h4 className="truncate text-sm font-bold text-text-primary">
          {agent.name}
        </h4>
        <span className="text-xs font-medium text-status-success">
          {agent.change}
        </span>
      </div>
      <div className="text-xs text-text-secondary">${agent.ticker}</div>
    </div>
  </div>
);

export default function ExploreAgentsCTA() {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-accent-primary/5 via-bg-card to-bg-card py-6">
      <div className="mb-6 px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-accent-primary/20 text-accent-primary">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-text-primary">
              Explore Agents
            </h3>
            <p className="text-xs text-text-secondary">
              Trending across the ecosystem
            </p>
          </div>
        </div>

        <Link href="/explore">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="group flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-white/10 hover:text-accent-primary transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </motion.button>
        </Link>
      </div>

      <div className="relative flex w-full overflow-hidden mask-linear-fade">
        <div className="absolute left-0 top-0 z-10 h-full w-12 bg-gradient-to-r from-bg-card to-transparent" />
        <div className="absolute right-0 top-0 z-10 h-full w-12 bg-gradient-to-l from-bg-card to-transparent" />

        <motion.div
          className="flex gap-4 px-4"
          animate={{
            x: [0, -1000],
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 20,
              ease: "linear",
            },
          }}
        >
          {[...marqueeAgents, ...marqueeAgents, ...marqueeAgents].map(
            (agent, i) => (
              <MarqueeCard key={`${agent.name}-${i}`} agent={agent} />
            ),
          )}
        </motion.div>
      </div>
    </div>
  );
}
