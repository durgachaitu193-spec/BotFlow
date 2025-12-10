import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TemplateNode, TemplateEdge } from "@/lib/templatesData";
import {
  Globe,
  Mail,
  MessageSquare,
  Youtube,
  Github,
  Database,
  Search,
  Bot,
  Zap,
  ArrowRight,
  Layers,
} from "lucide-react";

interface FlowPreviewProps {
  nodes: TemplateNode[];
  edges: TemplateEdge[];
}

const getNodeIcon = (type: string) => {
  switch (type) {
    case "trigger":
      return Zap;
    case "agent":
      return Bot;
    case "action":
      return ArrowRight;
    case "router":
      return Layers;
    case "memory":
      return Database;
    default:
      return Bot;
  }
};

const getNodeColor = (type: string) => {
  switch (type) {
    case "trigger":
      return "bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]";
    case "agent":
      return "bg-purple-500/10 text-purple-400 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)]";
    case "action":
      return "bg-green-500/10 text-green-400 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.1)]";
    case "router":
      return "bg-orange-500/10 text-orange-400 border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.1)]";
    case "memory":
      return "bg-pink-500/10 text-pink-400 border-pink-500/30 shadow-[0_0_15px_rgba(236,72,153,0.1)]";
    default:
      return "bg-gray-500/10 text-gray-400 border-gray-500/30";
  }
};

export default function FlowPreview({ nodes, edges }: FlowPreviewProps) {
  const minX = Math.min(...nodes.map((n) => n.position.x));
  const maxX = Math.max(...nodes.map((n) => n.position.x));
  const minY = Math.min(...nodes.map((n) => n.position.y));
  const maxY = Math.max(...nodes.map((n) => n.position.y));

  const width = maxX - minX + 300;
  const height = maxY - minY + 200;

  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="group relative h-[500px] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#050508] shadow-2xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)]" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-1 w-1 rounded-full bg-accent-primary/30"
            initial={{
              x: Math.random() * 1000,
              y: Math.random() * 500,
              opacity: 0,
            }}
            animate={{
              y: [null, Math.random() * -100],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      <div className="relative h-full w-full overflow-auto p-8 custom-scrollbar">
        <div
          className="relative mx-auto transition-transform duration-500 ease-out"
          style={{
            width: width,
            height: height,
            transform: isHovered ? "scale(1.02)" : "scale(1)",
          }}
        >
          <svg className="absolute inset-0 h-full w-full pointer-events-none overflow-visible">
            <defs>
              <linearGradient
                id="edge-gradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#334155" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.5" />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            {edges.map((edge, i) => {
              const source = nodes.find((n) => n.id === edge.source);
              const target = nodes.find((n) => n.id === edge.target);
              if (!source || !target) return null;

              const pathD = `M ${source.position.x + 100} ${source.position.y + 30} C ${source.position.x + 150} ${source.position.y + 30}, ${target.position.x - 50} ${target.position.y + 30}, ${target.position.x} ${target.position.y + 30}`;

              return (
                <g key={edge.id}>
                  <motion.path
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
                    d={pathD}
                    stroke="#334155"
                    strokeWidth="2"
                    fill="none"
                  />
                  <motion.circle r="3" fill="#4ade80">
                    <animateMotion
                      dur={`${2 + Math.random()}s`}
                      repeatCount="indefinite"
                      path={pathD}
                    />
                  </motion.circle>
                </g>
              );
            })}
          </svg>

          {nodes.map((node, i) => {
            const Icon = getNodeIcon(node.type);
            return (
              <motion.div
                key={node.id}
                initial={{ scale: 0, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{
                  delay: i * 0.1,
                  type: "spring",
                  stiffness: 200,
                  damping: 20,
                }}
                whileHover={{ scale: 1.05, y: -5, zIndex: 10 }}
                className={`absolute flex w-[200px] flex-col gap-3 rounded-xl border p-4 backdrop-blur-md transition-all duration-300 ${getNodeColor(node.type)}`}
                style={{ left: node.position.x, top: node.position.y }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg bg-white/10`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-bold text-white/90">
                    {node.label}
                  </span>
                </div>
                <div className="flex flex-col gap-2 opacity-50">
                  <div className="h-1.5 w-full rounded-full bg-current opacity-20" />
                  <div className="h-1.5 w-3/4 rounded-full bg-current opacity-20" />
                </div>
                <div className="absolute -right-1 -top-1 h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75"></span>
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-current"></span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
      <div className="absolute bottom-4 right-4 flex gap-2">
        <button className="rounded-lg bg-white/10 p-2 text-white/60 backdrop-blur-md hover:bg-white/20 hover:text-white">
          <Search className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
