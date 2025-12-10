"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Network } from "vis-network";
import { DataSet } from "vis-data";
import { X, Activity, Zap, Globe, Users, Bot } from "lucide-react";

type NodeType = "agent";

interface NodeData {
  id: string | number;
  label: string;
  group: NodeType;
  status: "active" | "inactive" | "busy";
  value?: number;
  image?: string;
  transactions?: number;
  recentActivity?: {
    type: string;
    time: string;
    details: string;
  }[];
}

import { generateNetworkData } from "@/lib/mockData";

interface NetworkGraphProps {
  data?: { nodes: any; edges: any };
  focusedNodeId?: string | number | null;
  disableDetailsPanel?: boolean;
}

const NetworkGraph = (props: NetworkGraphProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const { nodes: initialNodes, edges: initialEdges } =
    props.data || generateNetworkData();

  // Calculate initial active agents count
  const initialActiveAgents = props.data?.nodes
    ? props.data.nodes.length
    : initialNodes.length;

  const [stats, setStats] = useState({
    tps: 3420,
    activeAgents: initialActiveAgents,
    load: 52,
  });

  useEffect(() => {
    if (!containerRef.current) return;

    const nodes = props.data?.nodes || new DataSet(initialNodes);
    const edges = props.data?.edges || new DataSet(initialEdges);

    const options: any = {
      nodes: {
        borderWidth: 2,
        size: 30,
        font: {
          color: "#ffffff",
          size: 12,
          face: "Inter",
        },
      },
      edges: {
        smooth: {
          type: "continuous",
          forceDirection: "none",
          roundness: 0.5,
        },
        width: 2,
        selectionWidth: 4,
        hoverWidth: 3,
        color: {
          inherit: false,
          opacity: 0.5,
        },
      },
      physics: {
        stabilization: {
          enabled: true,
          iterations: 1000,
          updateInterval: 25,
          onlyDynamicEdges: false,
          fit: true,
        },
        barnesHut: {
          gravitationalConstant: -30000,
          centralGravity: 0.3,
          springLength: 120,
          springConstant: 0.04,
          damping: 0.3,
          avoidOverlap: 1,
        },
        minVelocity: 0.75,
      },
      interaction: {
        hover: true,
        tooltipDelay: 200,
        hideEdgesOnDrag: false,
        zoomView: true,
        dragView: true,
      },
    };

    const network = new Network(
      containerRef.current,
      { nodes, edges },
      options,
    );
    networkRef.current = network;

    network.on("click", (params) => {
      if (props.disableDetailsPanel) return;

      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const nodeData = (nodes instanceof DataSet
          ? nodes.get(nodeId)
          : nodes.find((n: any) => n.id === nodeId)) as unknown as NodeData;
        if (nodeData) {
          setSelectedNode({
            id: nodeData.id,
            label: nodeData.label,
            group: nodeData.group,
            status:
              nodeData.status || (Math.random() > 0.2 ? "active" : "busy"),
            image: nodeData.image,
            transactions: nodeData.transactions,
            recentActivity: nodeData.recentActivity,
          });
        }
      } else {
        setSelectedNode(null);
      }
    });

    const interval = setInterval(() => {
      setStats((prev) => ({
        tps: prev.tps + Math.floor(Math.random() * 50) - 25,
        activeAgents: prev.activeAgents, // Keep the count stable
        load: Math.min(
          100,
          Math.max(0, prev.load + Math.floor(Math.random() * 5) - 2),
        ),
      }));
    }, 800);

    return () => {
      clearInterval(interval);
      network.destroy();
    };
  }, [props.data]); // Add props.data dependency

  // Update active agents when data changes
  useEffect(() => {
    if (props.data?.nodes) {
      setStats((prev) => ({
        ...prev,
        activeAgents: props.data!.nodes.length,
      }));
    }
  }, [props.data]);

  useEffect(() => {
    if (props.focusedNodeId && networkRef.current) {
      networkRef.current.focus(props.focusedNodeId, {
        scale: 1.5,
        animation: {
          duration: 1000,
          easingFunction: "easeInOutQuad",
        },
      });

      if (!props.disableDetailsPanel) {
        const nodes = props.data?.nodes || new DataSet(initialNodes);
        const nodeData = (nodes instanceof DataSet
          ? nodes.get(props.focusedNodeId)
          : nodes.find(
              (n: any) => n.id === props.focusedNodeId,
            )) as unknown as NodeData;
        if (nodeData) {
          setSelectedNode(nodeData);
        }
      }
    }
  }, [props.focusedNodeId]);

  return (
    <div className="relative w-full h-[75vh] bg-[#030014] rounded-xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(74,222,128,0.1)]">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(74,222,128,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(74,222,128,0.05)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />
      <div className="absolute inset-0 bg-radial-gradient from-green-500/5 via-transparent to-[#030014] pointer-events-none" />
      <div ref={containerRef} className="absolute inset-0" />
      <div className="absolute top-6 left-6 flex gap-4 z-10">
        {/* <div className="bg-black/40 backdrop-blur-xl border border-green-500/20 rounded-xl p-4 min-w-[140px] shadow-[0_0_15px_rgba(74,222,128,0.1)]">
                    <div className="flex items-center gap-2 mb-2">
                        <Zap size={14} className="text-green-400" />
                        <div className="text-green-200/60 text-[10px] uppercase tracking-wider font-semibold">Network TPS</div>
                    </div>
                    <div className="text-2xl font-bold text-white font-mono tracking-tight drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]">{stats.tps.toLocaleString()}</div>
                </div> */}
        <div className="bg-black/40 backdrop-blur-xl border border-green-500/20 rounded-xl p-4 min-w-[140px] shadow-[0_0_15px_rgba(74,222,128,0.1)]">
          <div className="flex items-center gap-2 mb-2">
            <Bot size={14} className="text-green-400" />
            <div className="text-green-200/60 text-[10px] uppercase tracking-wider font-semibold">
              Active Agents
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono tracking-tight drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]">
            {stats.activeAgents}
          </div>
        </div>
        {/* <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-4 min-w-[140px] shadow-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <Activity size={14} className="text-green-400" />
                        <div className="text-gray-400 text-[10px] uppercase tracking-wider font-semibold">Network Load</div>
                    </div>
                    <div className="text-2xl font-bold text-white font-mono tracking-tight">{stats.load}%</div>
                </div> */}
      </div>
      <div className="absolute bottom-6 left-6 bg-black/60 p-4 rounded-xl border border-white/10 backdrop-blur-xl shadow-lg z-10">
        <h3 className="text-white/60 text-[10px] font-bold mb-3 uppercase tracking-wider">
          Network Entities
        </h3>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full border-2 border-green-500 bg-black shadow-[0_0_10px_#4ade80]"></div>
            <span className="text-xs text-green-100 font-medium">AI Agent</span>
          </div>
        </div>
      </div>
      <div
        className={`absolute top-6 bottom-6 right-6 w-80 bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl transform transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) shadow-2xl z-20 ${
          selectedNode
            ? "translate-x-0 opacity-100"
            : "translate-x-[120%] opacity-0"
        }`}
      >
        {selectedNode && (
          <div className="p-6 h-full flex flex-col">
            <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img
                    src={selectedNode.image}
                    alt={selectedNode.label}
                    className="w-12 h-12 rounded-full border-2 border-green-500 shadow-[0_0_15px_rgba(74,222,128,0.5)]"
                  />
                  <div
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-black ${selectedNode.status === "active" ? "bg-green-500" : "bg-yellow-500"}`}
                  />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                    {selectedNode.label}
                  </h2>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mt-1 bg-green-500/10 text-green-300 border border-green-500/20 shadow-[0_0_10px_rgba(74,222,128,0.2)]">
                    AI Agent
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-white/40 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {/* Status Section */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <div className="flex items-center gap-3 mb-3">
                  <Activity size={16} className="text-white/60" />
                  <span className="text-xs font-bold text-white/60 uppercase tracking-wider">
                    Status
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${selectedNode.status === "active" ? "bg-green-500 shadow-[0_0_10px_#22c55e]" : "bg-yellow-500"}`}
                    />
                    {selectedNode.status === "active" && (
                      <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green-500 animate-ping opacity-75" />
                    )}
                  </div>
                  <span className="text-sm text-white font-medium capitalize">
                    {selectedNode.status}
                  </span>
                </div>
              </div>

              {/* Metrics Section */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
                  Performance Metrics
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  {/* <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                                        <div className="text-xs text-white/40 mb-1">Uptime</div>
                                        <div className="text-sm text-white font-mono font-medium">99.9%</div>
                                    </div>
                                    <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                                        <div className="text-xs text-white/40 mb-1">Latency</div>
                                        <div className="text-sm text-white font-mono font-medium">{Math.floor(Math.random() * 50 + 10)}ms</div>
                                    </div> */}
                  <div className="bg-white/5 p-3 rounded-lg border border-white/5 col-span-2">
                    <div className="text-xs text-white/40 mb-1">
                      Transactions
                    </div>
                    <div className="text-sm text-white font-mono font-medium">
                      {selectedNode.transactions?.toLocaleString() || "0"}
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
                  Recent Activity
                </h3>
                <div className="space-y-0 relative">
                  <div className="absolute left-1.5 top-2 bottom-2 w-px bg-white/10" />

                  {selectedNode.recentActivity &&
                  selectedNode.recentActivity.length > 0 ? (
                    selectedNode.recentActivity.map((activity, i) => (
                      <div key={i} className="relative pl-6 py-2 group">
                        <div className="absolute left-0 top-3 w-3 h-3 rounded-full bg-[#0a0a0a] border border-white/20 group-hover:border-white/40 transition-colors z-10" />
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] text-white/40 font-mono">
                            {activity.time}
                          </span>
                          <span className="text-xs text-gray-300">
                            {activity.details}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="pl-6 py-2 text-xs text-white/40">
                      No recent activity
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/10">
              <Link href={`/agent/${selectedNode.id}`} className="block w-full">
                <button className="w-full py-3 bg-white text-black hover:bg-gray-200 rounded-xl text-sm font-bold transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                  View Full Details
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworkGraph;
