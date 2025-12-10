"use client";

import React, { useRef } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import Link from "next/link";
import { MessageSquare, Zap } from "lucide-react";

import { Agent } from "@/lib/agentsData";

interface AgentCardProps {
  agent: Agent;
  index: number;
}

const ROTATION_RANGE = 20;
const HALF_ROTATION_RANGE = ROTATION_RANGE / 2;

export default function AgentCard({ agent, index }: AgentCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const xSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const ySpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(
    ySpring,
    [-0.5, 0.5],
    [ROTATION_RANGE, -ROTATION_RANGE],
  );
  const rotateY = useTransform(
    xSpring,
    [-0.5, 0.5],
    [-ROTATION_RANGE, ROTATION_RANGE],
  );

  const shineX = useTransform(xSpring, [-0.5, 0.5], ["0%", "100%"]);
  const shineY = useTransform(ySpring, [-0.5, 0.5], ["0%", "100%"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = (e.clientX - rect.left) / width - 0.5;
    const mouseY = (e.clientY - rect.top) / height - 0.5;

    x.set(mouseX);
    y.set(mouseY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        delay: index * 0.05,
        type: "spring",
        stiffness: 300,
        damping: 25,
      }}
      style={{
        perspective: 1000,
      }}
      className="h-full"
    >
      <Link href={`/agent/${agent.id}`}>
        <motion.div
          ref={ref}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            rotateX,
            rotateY,
            transformStyle: "preserve-3d",
          }}
          className="group relative h-full cursor-pointer rounded-2xl border border-white/5 bg-bg-card p-4 transition-all hover:border-accent-primary/50 hover:shadow-glow-primary"
        >
          <motion.div
            style={{
              background: useMotionTemplate`radial-gradient(
                circle at ${shineX} ${shineY},
                rgba(255, 255, 255, 0.15),
                transparent 80%
              )`,
            }}
            className="absolute inset-0 z-10 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-2xl" />
          {index % 4 === 0 && (
            <div
              className="absolute right-4 top-4 z-20 transform-gpu translate-z-20"
              style={{ transform: "translateZ(20px)" }}
            >
              <div className="flex items-center gap-1 rounded-full bg-status-success/20 px-2 py-1 text-xs font-medium text-status-success backdrop-blur-md">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-status-success" />
                LIVE
              </div>
            </div>
          )}

          <div
            className="relative z-10 flex flex-col h-full transform-gpu"
            style={{ transform: "translateZ(10px)" }}
          >
            <div className="flex gap-4 mb-3">
              <motion.div
                className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-bg-surface p-1 shadow-lg"
                style={{ transform: "translateZ(30px)" }}
              >
                <img
                  src={agent.image}
                  alt={agent.name}
                  className="h-full w-full rounded-lg bg-bg-deep object-cover"
                />
              </motion.div>
              <div
                className="flex-1 min-w-0"
                style={{ transform: "translateZ(20px)" }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-bold text-text-primary text-lg leading-tight">
                      {agent.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-bold text-accent-primary bg-accent-primary/10 px-1.5 py-0.5 rounded">
                        ${agent.ticker}
                      </span>
                      <span className="text-xs text-text-muted">
                        {agent.timeAgo}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-2 text-xs text-text-secondary">
                  <span className="truncate">by {agent.creator}</span>
                </div>
              </div>
            </div>
            {agent.description && (
              <p
                className="mb-4 line-clamp-2 text-xs text-text-muted leading-relaxed"
                style={{ transform: "translateZ(15px)" }}
              >
                {agent.description}
              </p>
            )}

            <div
              className="mt-auto space-y-3"
              style={{ transform: "translateZ(25px)" }}
            >
              <div className="flex items-center justify-between rounded-lg bg-bg-surface/50 p-2.5 shadow-inner">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-text-muted font-medium">
                    Market Cap
                  </div>
                  <div className="font-mono text-sm font-bold text-text-primary">
                    {agent.marketCap}
                  </div>
                </div>
                <div
                  className={`text-right ${agent.isPositive ? "text-status-success" : "text-status-error"}`}
                >
                  <div className="text-[10px] uppercase tracking-wider text-text-muted font-medium opacity-0">
                    Change
                  </div>
                  <div className="flex items-center justify-end gap-1 text-sm font-bold bg-current/10 px-2 py-0.5 rounded">
                    {agent.change}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                <button className="flex items-center justify-center gap-1.5 rounded-lg bg-accent-primary/10 py-2 text-xs font-bold text-accent-primary hover:bg-accent-primary hover:text-bg-deep transition-colors shadow-lg hover:shadow-accent-primary/25">
                  <Zap className="h-3.5 w-3.5" />
                  Quick Buy
                </button>
                <div className="flex items-center justify-center gap-1.5 rounded-lg bg-bg-surface py-2 text-xs font-medium text-text-secondary shadow-lg">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Replies
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}
