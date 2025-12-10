import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, ExternalLink, ArrowLeft } from "lucide-react";
import NetworkGraph from "./NetworkGraph";
import { generateNetworkData, NodeData } from "@/lib/mockData";
import { DataSet } from "vis-data";
import { getAgents } from "@/actions/getAgents";

export default function SpotlightAgent() {
  const [currentAgentIndex, setCurrentAgentIndex] = useState(0);
  const [networkData, setNetworkData] = useState<{
    nodes: any;
    edges: any;
  } | null>(null);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const agents = await getAgents();
        const data = generateNetworkData(agents);
        setNetworkData({
          nodes: new DataSet(data.nodes),
          edges: new DataSet(data.edges),
        });
      } catch (error) {
        console.error("Failed to fetch agents:", error);
        const data = generateNetworkData();
        setNetworkData({
          nodes: new DataSet(data.nodes),
          edges: new DataSet(data.edges),
        });
      }
    };

    fetchAgents();
  }, []);

  const handleNext = () => {
    if (!networkData) return;
    setCurrentAgentIndex((prev) => (prev + 1) % networkData.nodes.length);
  };

  const handlePrev = () => {
    if (!networkData) return;
    setCurrentAgentIndex(
      (prev) =>
        (prev - 1 + networkData.nodes.length) % networkData.nodes.length,
    );
  };

  if (!networkData) return null;

  const allNodes = networkData.nodes.get() as NodeData[];
  const currentAgent = allNodes[currentAgentIndex];

  if (!currentAgent) return null;

  return (
    <div
      className="relative w-full rounded-3xl p-4"
      style={{
        background:
          "linear-gradient(360deg, rgba(0, 255, 243, 0.31) 0%, rgba(0, 0, 0, 0.31) 55.98%)",
        border: "1px solid rgba(0, 249, 207, 0.3)",
        backdropFilter: "blur(92px)",
        boxShadow: "0px 4px 4px 0px rgba(0, 0, 0, 0.25)",
      }}
    >
      <div className="relative z-10 flex flex-col-reverse md:flex-row rounded-[20px] min-h-[600px] h-auto p-4">
        <div className="relative z-20 flex-1 p-4 md:p-10 flex flex-col justify-between">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent-primary/30 bg-accent-primary/10 px-3 py-1 text-xs font-medium text-accent-primary">
              <Sparkles className="h-3 w-3" />
              Spotlight Agent
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentAgent.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="h-12 w-12 md:h-16 md:w-16 p-1 overflow-hidden rounded-full border-2 border-accent-primary/50 bg-bg-surface shrink-0">
                      <img
                        src={currentAgent.image}
                        alt={currentAgent.label}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold text-white">
                        {currentAgent.label}
                      </h2>
                      <div className="flex items-center gap-2 text-xs md:text-sm text-text-secondary">
                        <span
                          className={`h-2 w-2 rounded-full ${currentAgent.status === "active" ? "bg-status-success animate-pulse" : "bg-yellow-500"}`}
                        />
                        Autonomous Agent
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-text-secondary">FDV</div>
                    <div className="text-lg md:text-xl font-bold text-white">
                      {currentAgent.fdv || "$11M"}
                    </div>
                    <div className="text-xs md:text-sm font-medium text-status-success">
                      {currentAgent.change || "+2.80%"}
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                    {currentAgent.transactions?.toLocaleString() || "0"}
                  </div>
                  <div className="text-sm text-text-secondary">
                    Transactions
                  </div>
                </div>

                <div className="mb-6">
                  <div className="text-sm text-text-secondary mb-2">
                    Interacted with
                  </div>
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="h-8 w-8 overflow-hidden rounded-full border-2 border-bg-deep bg-bg-surface"
                      >
                        <img
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${String(currentAgent.id)}${i}`}
                          alt="User"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-bg-deep bg-bg-surface text-xs font-medium text-text-secondary">
                      +12
                    </div>
                  </div>
                </div>

                <div className="mb-8">
                  <div className="text-sm text-text-secondary mb-2">
                    Description
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">
                    {currentAgent.description ||
                      "An AI brand ambassador and campaign orchestrator for crypto token projects. Mobilizes network to execute complex DeFi strategies."}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/agent/${currentAgent.id}`}
                className="flex-1 group flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold text-white transition-all hover:scale-[1.02]"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(0, 255, 243, 0.1) 0%, rgba(0, 40, 40, 0.4) 100%)",
                  boxShadow:
                    "inset 0 1px 1px rgba(255, 255, 255, 0.2), 0 4px 10px rgba(0, 0, 0, 0.3)",
                  border: "1px solid rgba(0, 255, 243, 0.1)",
                }}
              >
                View Profile
                <ArrowRight className="h-4 w-4 text-white transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/network"
                className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white transition-all hover:bg-white/10"
              >
                <ExternalLink className="h-5 w-5" />
              </Link>
            </div>
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={handlePrev}
                className="flex items-center justify-center w-10 h-10 rounded-full transition-all active:scale-95"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(0, 255, 243, 0.1) 0%, rgba(0, 40, 40, 0.4) 100%)",
                  boxShadow:
                    "inset 0 1px 1px rgba(255, 255, 255, 0.2), 0 4px 10px rgba(0, 0, 0, 0.3)",
                  border: "1px solid rgba(0, 255, 243, 0.1)",
                }}
              >
                <ArrowLeft size={20} className="text-white" />
              </button>
              <div className="flex gap-2 items-center">
                {allNodes.slice(0, 5).map((_: any, i: number) => (
                  <div
                    key={i}
                    className={`rounded-full transition-all duration-300 ${i === currentAgentIndex % 5 ? "w-8 h-3" : "w-3 h-3"}`}
                    style={{
                      background:
                        i === currentAgentIndex % 5
                          ? "linear-gradient(180deg, rgba(0, 255, 243, 0.2) 0%, rgba(0, 255, 243, 0.05) 100%)"
                          : "linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)",
                      boxShadow:
                        "inset 0 1px 1px rgba(255, 255, 255, 0.1), 0 2px 4px rgba(0, 0, 0, 0.2)",
                      border:
                        i === currentAgentIndex % 5
                          ? "1px solid rgba(0, 255, 243, 0.2)"
                          : "1px solid rgba(255, 255, 255, 0.1)",
                    }}
                  />
                ))}
              </div>
              <button
                onClick={handleNext}
                className="flex items-center justify-center w-10 h-10 rounded-full transition-all active:scale-95"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(0, 255, 243, 0.1) 0%, rgba(0, 40, 40, 0.4) 100%)",
                  boxShadow:
                    "inset 0 1px 1px rgba(255, 255, 255, 0.2), 0 4px 10px rgba(0, 0, 0, 0.3)",
                  border: "1px solid rgba(0, 255, 243, 0.1)",
                }}
              >
                <ArrowRight size={20} className="text-white" />
              </button>
            </div>
          </div>
        </div>
        <div className="relative flex-1 min-h-[500px] md:min-h-auto overflow-hidden rounded-b-[20px] md:rounded-r-[20px] md:rounded-bl-none">
          <NetworkGraph
            data={networkData}
            focusedNodeId={currentAgent.id}
            disableDetailsPanel={true}
          />
        </div>
      </div>
    </div>
  );
}
