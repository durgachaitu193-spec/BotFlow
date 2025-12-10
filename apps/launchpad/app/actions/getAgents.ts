"use server";

import { db } from "@/db";
import { agent } from "@sim/db/schema";
import { desc } from "drizzle-orm";
import { Agent } from "@/lib/agentsData";
import { getTransactions } from "./getTransactions";

export async function getAgents(): Promise<Agent[]> {
  try {
    const agents = await db.query.agent.findMany({
      orderBy: [desc(agent.createdAt)],
      where: (agents, { eq }) => eq(agents.isActive, true),
    });

    // Fetch all transactions once
    const allTransactions = await getTransactions();

    return agents.map((a) => {
      const metadata = a.metadata as Record<string, unknown>;
      const name = String(
        metadata?.chatTitle ||
          metadata?.tokenName ||
          metadata?.name ||
          "Unknown Agent",
      ).toUpperCase();

      // Filter transactions specific to this agent (tokenId matches agent.id)
      const agentTransactions = allTransactions.filter(
        (t) => t.tokenId === a.id,
      );

      // Format recent activity from transactions (most recent first, limit to 5)
      const recentActivity = agentTransactions.slice(0, 5).map((tx) => {
        const isSell = tx.type === "sell";
        const actionType = isSell ? "Sold" : "Bought";

        // Format time as relative time (e.g., "2m ago", "1h ago", "3d ago")
        const now = new Date();
        const txTime = new Date(tx.createdAt);
        const diffMs = now.getTime() - txTime.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        let timeStr;
        if (diffMins < 60) {
          timeStr = `${diffMins}m ago`;
        } else if (diffHours < 24) {
          timeStr = `${diffHours}h ago`;
        } else {
          timeStr = `${diffDays}d ago`;
        }

        return {
          type: tx.type,
          time: timeStr,
          details: `${actionType} ${parseFloat(tx.amount).toFixed(2)} ${tx.symbol}`,
        };
      });

      return {
        id: a.id,
        name,
        ticker: String(metadata?.tokenSymbol || metadata?.ticker || "UNKNOWN"),
        creator: a.ownerWallet,
        timeAgo: new Date(a.createdAt).toLocaleDateString(),
        marketCap: "$0",
        change: "0%",
        image: metadata?.tokenIpfsHash
          ? `https://gateway.pinata.cloud/ipfs/${String(metadata.tokenIpfsHash)}`
          : String(
              metadata?.image ||
                `https://api.dicebear.com/7.x/bottts/svg?seed=${a.id}`,
            ),
        isPositive: true,
        status: a.isActive ? "active" : "inactive",
        description: String(
          metadata?.chatDescription || metadata?.description || "",
        ),
        transactions: agentTransactions.length,
        recentActivity,
        fdv: "$0",
        price: "$0",
      };
    });
  } catch (error) {
    console.error("Error fetching agents:", error);
    return [];
  }
}

export async function getAgentById(id: string): Promise<Agent | undefined> {
  try {
    const result = await db.query.agent.findFirst({
      where: (agents, { eq }) => eq(agents.id, id),
    });

    if (!result) return undefined;

    const metadata = result.metadata as Record<string, unknown>;

    // Extract token details from metadata
    const rawName = String(
      metadata?.chatTitle ||
        metadata?.tokenName ||
        metadata?.name ||
        "Unknown Agent",
    );
    const tokenName = rawName.toUpperCase();
    const tokenTicker = String(
      metadata?.tokenSymbol || metadata?.ticker || "UNKNOWN",
    );
    const tokenAddress = String(metadata?.tokenAddress || result.agentWallet);
    const tokenImage = metadata?.tokenIpfsHash
      ? `https://gateway.pinata.cloud/ipfs/${String(metadata.tokenIpfsHash)}`
      : String(
          metadata?.image ||
            `https://api.dicebear.com/7.x/bottts/svg?seed=${result.id}`,
        );

    return {
      id: result.id,
      name: tokenName,
      ticker: tokenTicker,
      creator: result.ownerWallet,
      timeAgo: new Date(result.createdAt).toLocaleDateString(),
      marketCap: "$0", // Placeholder
      change: "0%", // Placeholder
      image: tokenImage,
      isPositive: true,
      status: "active",
      description: String(metadata?.chatDescription || ""),
      transactions: 0,
      fdv: "$0",
      price: "$0",
      holders: "0",
      contractAddress: tokenAddress,
      deploymentType: result.deploymentType as "api" | "chat",
      chatUrl: String(metadata?.chatUrl || ""),
    };
  } catch (error) {
    console.error("Error fetching agent:", error);
    return undefined;
  }
}
