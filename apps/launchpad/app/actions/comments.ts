"use server";

import { db } from "@sim/db";
import { launchpadComments } from "@sim/db/schema";
import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getComments(tokenId: string) {
  try {
    const comments = await db.query.launchpadComments.findMany({
      where: eq(launchpadComments.tokenId, tokenId),
      orderBy: [desc(launchpadComments.createdAt)],
    });
    return comments;
  } catch (error) {
    console.error("Error fetching comments:", error);
    return [];
  }
}

export async function postComment(
  tokenId: string,
  message: string,
  address: string,
) {
  try {
    await db.insert(launchpadComments).values({
      id: crypto.randomUUID(),
      tokenId,
      message,
      address,
      createdAt: new Date(),
    });
    revalidatePath(`/agent/${tokenId}`);
    return { success: true };
  } catch (error) {
    console.error("Error posting comment:", error);
    return { success: false, error };
  }
}
