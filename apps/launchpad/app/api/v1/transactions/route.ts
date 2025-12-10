import { NextRequest, NextResponse } from "next/server";
import { withErrorHandling } from "@/api/v1/utils/withErrorHandling";
import { StatusCodes } from "http-status-codes";
import { db } from "@sim/db";
import { launchpadTransactions } from "@sim/db/schema";
import { eq, desc } from "drizzle-orm";

export const GET = withErrorHandling(async (req: NextRequest) => {
  const tokenId = req.nextUrl.searchParams.get("tokenId");

  if (tokenId) {
    const transactions = await db.query.launchpadTransactions.findMany({
      where: eq(launchpadTransactions.tokenId, tokenId),
      orderBy: [desc(launchpadTransactions.createdAt)],
    });
    return NextResponse.json({ transactions }, { status: StatusCodes.OK });
  } else {
    const transactions = await db.query.launchpadTransactions.findMany({
      orderBy: [desc(launchpadTransactions.createdAt)],
      limit: 10,
    });
    return NextResponse.json({ transactions }, { status: StatusCodes.OK });
  }
});
