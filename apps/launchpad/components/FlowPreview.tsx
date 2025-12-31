import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import { TemplateNode, TemplateEdge } from "@/lib/templatesData";
import {
  Zap,
  Bot,
  ArrowRight,
  Layers,
  Database,
  Mail,
  Globe,
  MessageSquare,
  Youtube,
  Github,
  Search as SearchIcon,
  Box,
  Plus,
  Minus,
  Maximize,
  MousePointer2
} from "lucide-react";

interface FlowPreviewProps {
  nodes: TemplateNode[];
  edges: TemplateEdge[];
}

const getNodeIcon = (type: string, blockType?: string) => {
  if (blockType) {
    if (blockType.includes("gmail")) return Mail;
    if (blockType.includes("browser") || blockType.includes("google")) return Globe;
    if (blockType.includes("chat") || blockType.includes("telegram") || blockType.includes("slack")) return MessageSquare;
    if (blockType.includes("youtube")) return Youtube;
    if (blockType.includes("github")) return Github;
    if (blockType.includes("search") || blockType.includes("tavily") || blockType.includes("perplexity")) return SearchIcon;
    if (blockType.includes("pinecone") || blockType.includes("mongodb") || blockType.includes("postgres") || blockType.includes("db")) return Database;
  }

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
      return Box;
  }
};

const getNodeColor = (type: string) => {
  switch (type) {
    case "trigger":
      return "#3b82f6";
    case "agent":
      return "#8b5cf6";
    case "action":
      return "#10b981";
    case "router":
      return "#f59e0b";
    case "memory":
      return "#ec4899";
    default:
      return "#6b7280";
  }
};

export default function FlowPreview({ nodes, edges }: FlowPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  // Motion values for pan and zoom
  const scale = useMotionValue(1);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth springs for fluid motion
  const springConfig = { damping: 30, stiffness: 200, mass: 0.5 };
  const smoothScale = useSpring(scale, springConfig);
  const smoothX = useSpring(x, springConfig);
  const smoothY = useSpring(y, springConfig);

  const calculateFitView = useCallback(() => {
    if (!containerRef.current || nodes.length === 0) return { x: 0, y: 0, scale: 0.8 };

    const padding = 80;
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;

    const minX = Math.min(...nodes.map((n) => n.position.x));
    const maxX = Math.max(...nodes.map((n) => n.position.x)) + 250; // Include node width
    const minY = Math.min(...nodes.map((n) => n.position.y));
    const maxY = Math.max(...nodes.map((n) => n.position.y)) + 150; // Include estimated node height

    const graphWidth = maxX - minX;
    const graphHeight = maxY - minY;

    const scaleX = (containerWidth - padding * 2) / graphWidth;
    const scaleY = (containerHeight - padding * 2) / graphHeight;
    const nextScale = Math.min(scaleX, scaleY, 1);

    const centerX = minX + graphWidth / 2;
    const centerY = minY + graphHeight / 2;

    const nextX = containerWidth / 2 - centerX * nextScale;
    const nextY = containerHeight / 2 - centerY * nextScale;

    return { x: nextX, y: nextY, scale: nextScale };
  }, [nodes]);

  // Initial fit view animation
  useEffect(() => {
    const timer = setTimeout(() => {
      const fit = calculateFitView();
      x.set(fit.x);
      y.set(fit.y);
      scale.set(fit.scale);
      setIsReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, [calculateFitView, x, y, scale]);

  const handleWheel = (e: React.WheelEvent) => {
    if (!containerRef.current) return;

    e.preventDefault();
    const zoomIntensity = 0.0015;
    const delta = -e.deltaY;
    const newScale = Math.min(Math.max(scale.get() + delta * zoomIntensity, 0.2), 2);

    // Zoom towards mouse position
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = newScale / scale.get();
    const newX = mouseX - (mouseX - x.get()) * zoomFactor;
    const newY = mouseY - (mouseY - y.get()) * zoomFactor;

    scale.set(newScale);
    x.set(newX);
    y.set(newY);
  };

  const zoomIn = () => {
    const nextScale = Math.min(scale.get() * 1.2, 2);
    const fit = containerRef.current?.getBoundingClientRect();
    if (!fit) return;
    const centerX = fit.width / 2;
    const centerY = fit.height / 2;
    const zoomFactor = nextScale / scale.get();
    x.set(centerX - (centerX - x.get()) * zoomFactor);
    y.set(centerY - (centerY - y.get()) * zoomFactor);
    scale.set(nextScale);
  };

  const zoomOut = () => {
    const nextScale = Math.max(scale.get() / 1.2, 0.2);
    const fit = containerRef.current?.getBoundingClientRect();
    if (!fit) return;
    const centerX = fit.width / 2;
    const centerY = fit.height / 2;
    const zoomFactor = nextScale / scale.get();
    x.set(centerX - (centerX - x.get()) * zoomFactor);
    y.set(centerY - (centerY - y.get()) * zoomFactor);
    scale.set(nextScale);
  };

  const resetView = () => {
    const fit = calculateFitView();
    x.set(fit.x);
    y.set(fit.y);
    scale.set(fit.scale);
  };

  return (
    <div
      ref={containerRef}
      className="group relative h-[600px] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#050508] shadow-2xl transition-all duration-500 cursor-grab active:cursor-grabbing"
      onWheel={handleWheel}
    >
      {/* Canvas Grid Background */}
      <motion.div
        style={{ x: smoothX, y: smoothY, scale: smoothScale }}
        className="absolute inset-0 pointer-events-none"
      >
        <div className="absolute inset-[-200%] bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-50" />
      </motion.div>

      {/* Dynamic Background Glows */}
      <div className="absolute inset-0 pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black_60%,transparent_100%)]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[800px] bg-accent-primary/5 blur-[120px] rounded-full" />
      </div>

      {/* Interactive Layer */}
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0}
        onDrag={(_, info) => {
          x.set(x.get() + info.delta.x);
          y.set(y.get() + info.delta.y);
        }}
        style={{ x: smoothX, y: smoothY, scale: smoothScale }}
        className="relative h-full w-full transform-gpu"
      >
        <AnimatePresence>
          {isReady && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              {/* Edges Container */}
              <svg className="absolute inset-0 h-[5000px] w-[5000px] pointer-events-none overflow-visible translate-x-[-1500px] translate-y-[-1500px]">
                <g transform="translate(1500, 1500)">
                  {edges.map((edge, i) => {
                    const source = nodes.find((n) => (n as any).id === edge.source);
                    const target = nodes.find((n) => (n as any).id === edge.target);
                    if (!source || !target) return null;

                    const sourceX = source.position.x + 250;
                    const sourceY = source.position.y + 24;
                    const targetX = target.position.x;
                    const targetY = target.position.y + 24;

                    const midX = sourceX + (targetX - sourceX) / 2;
                    const borderRadius = 12;
                    const pathD = `
                      M ${sourceX} ${sourceY}
                      L ${midX - borderRadius} ${sourceY}
                      Q ${midX} ${sourceY}, ${midX} ${sourceY < targetY ? sourceY + borderRadius : sourceY - borderRadius}
                      L ${midX} ${targetY < sourceY ? targetY + borderRadius : targetY - borderRadius}
                      Q ${midX} ${targetY}, ${midX + borderRadius} ${targetY}
                      L ${targetX} ${targetY}
                    `;

                    return (
                      <g key={edge.id}>
                        <motion.path
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: 1 }}
                          transition={{ delay: 0.2 + i * 0.03, duration: 0.8 }}
                          d={pathD}
                          stroke="rgba(255, 255, 255, 0.1)"
                          strokeWidth="2.5"
                          fill="none"
                          strokeLinejoin="round"
                          strokeLinecap="round"
                        />
                        <circle r="3" fill="var(--accent-primary)">
                          <animateMotion
                            dur={`${4 + Math.random() * 2}s`}
                            repeatCount="indefinite"
                            path={pathD}
                            calcMode="linear"
                          />
                          <animate
                            attributeName="opacity"
                            values="0;0.5;0"
                            dur="4s"
                            repeatCount="indefinite"
                          />
                        </circle>
                      </g>
                    );
                  })}
                </g>
              </svg>

              {/* Nodes Container */}
              {nodes.map((node, i) => {
                const color = getNodeColor(node.type);
                const Icon = getNodeIcon(node.type, (node as any).blockType);
                const subBlocks = (node as any).data?.subBlocks;
                const subBlockEntries = subBlocks ? Object.entries(subBlocks).filter(([key]) => !key.startsWith('_')).slice(0, 4) : [];

                return (
                  <motion.div
                    key={(node as any).id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="absolute w-[250px] select-none rounded-[10px] border border-white/10 bg-[#0c0d12] shadow-2xl overflow-hidden backdrop-blur-md hover:border-white/30 transition-colors pointer-events-auto"
                    style={{ left: node.position.x, top: node.position.y }}
                  >
                    <div className="flex items-center gap-[10px] p-[10px] border-b border-white/5 bg-white/[0.02]">
                      <div
                        className="flex h-[28px] w-[28px] flex-shrink-0 items-center justify-center rounded-[6px] shadow-lg"
                        style={{ background: color }}
                      >
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <span className="truncate font-semibold text-[15px] text-white/95 tracking-tight">
                        {node.label}
                      </span>
                    </div>

                    <div className="p-[10px] flex flex-col gap-2">
                      {subBlockEntries.length > 0 ? (
                        subBlockEntries.map(([key, val]: [string, any]) => (
                          <div key={key} className="flex items-center justify-between gap-2 overflow-hidden">
                            <span className="truncate text-[12px] text-white/40 capitalize min-w-0">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <span className="truncate text-[12px] text-white/80 font-medium text-right flex-1 min-w-0">
                              {(() => {
                                const displayVal = typeof val === 'object' && val !== null ? (val.value ?? "-") : (val ?? "-");
                                return typeof displayVal === 'object' ? "-" : String(displayVal);
                              })()}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="space-y-2 py-1">
                          <div className="h-1.5 w-full bg-white/5 rounded-full" />
                          <div className="h-1.5 w-2/3 bg-white/5 rounded-full" />
                        </div>
                      )}

                      <div className="flex justify-center gap-1.5 opacity-30 mt-1">
                        <div className="h-1 w-1 rounded-full bg-white/40" />
                        <div className="h-1 w-1 rounded-full bg-white/40" />
                        <div className="h-1 w-1 rounded-full bg-white/40" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Floating Controls */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-2 p-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50">
        <div className="flex flex-col">
          <button
            onClick={zoomIn}
            title="Zoom In"
            className="p-2.5 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            onClick={zoomOut}
            title="Zoom Out"
            className="p-2.5 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all"
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>
        <div className="h-px bg-white/10 mx-2" />
        <button
          onClick={resetView}
          title="Fit to View"
          className="p-2.5 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all"
        >
          <Maximize className="h-4 w-4" />
        </button>
      </div>

      <div className="absolute top-6 left-6 flex items-center gap-2 px-3 py-1.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg text-[10px] font-medium text-white/40 select-none">
        <MousePointer2 className="h-3 w-3" />
        DRAG TO PAN • SCROLL TO ZOOM
      </div>

      {/* Decorative corner accents */}
      <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-accent-primary/5 to-transparent pointer-events-none opacity-50" />
      <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-accent-primary/5 to-transparent pointer-events-none opacity-50" />
    </div>
  );
}
