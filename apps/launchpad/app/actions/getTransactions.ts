"use server";

import { db } from "@sim/db";
import { launchpadTransactions } from "@sim/db/schema";
import { desc, eq } from "drizzle-orm";

export interface Transaction {
  txHash: string;
  tokenId: string;
  type: string;
  amount: string;
  value: string;
  from: string;
  to: string;
  createdAt: Date;
  symbol: string;
  currentPrice: string;
}

export async function getTransactions(
  tokenId?: string,
): Promise<Transaction[]> {
  try {
    const whereClause = tokenId
      ? eq(launchpadTransactions.tokenId, tokenId)
      : undefined;

    const transactions = await db.query.launchpadTransactions.findMany({
      where: whereClause,
      orderBy: [desc(launchpadTransactions.createdAt)],
      limit: 20,
    });

    return transactions.map((tx) => ({
      ...tx,
      createdAt: new Date(tx.createdAt),
    }));
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
}
