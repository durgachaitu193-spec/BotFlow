import { NextRequest, NextResponse } from "next/server";
import { withErrorHandling } from "@/api/v1/utils/withErrorHandling";
import { ERROR_CODES, ERROR_MESSAGES } from "@/global/utils/constants/errors";
import { StatusCodes } from "http-status-codes";
import { APIError } from "@/global/exceptions";
import { getBody } from "@/api/v1/utils/getBody";
import { SIGN_MESSAGE } from "@/global/constants";
import { db } from "@sim/db";
import { launchpadComments } from "@sim/db/schema";
import { cryptoWaitReady, signatureVerify } from "@polkadot/util-crypto";
import { getSubstrateAddress } from "@/global/utils/getSubstrateAddress";
import { v4 as uuidv4 } from "uuid";

export const POST = withErrorHandling(async (req: NextRequest) => {
  const { img, tokenId, address, signature, message } = await getBody(req);

  if (!tokenId || !address || !signature || !message) {
    throw new APIError(
      ERROR_CODES.INVALID_PARAMS_ERROR,
      StatusCodes.BAD_REQUEST,
      ERROR_MESSAGES.INVALID_PARAMS_ERROR,
    );
  }

  const substrateAddress = getSubstrateAddress(address) || address;

  await cryptoWaitReady();
  const { isValid } = signatureVerify(
    SIGN_MESSAGE,
    signature,
    substrateAddress,
  );

  if (!isValid) {
    throw new APIError(
      ERROR_CODES.UNAUTHORIZED,
      StatusCodes.BAD_REQUEST,
      ERROR_MESSAGES.UNAUTHORIZED,
    );
  }

  const newComment = {
    id: uuidv4(),
    img,
    tokenId,
    address,
    message,
    createdAt: new Date(),
  };

  await db.insert(launchpadComments).values(newComment);

  return NextResponse.json(
    { message: "success", comment: newComment },
    { status: StatusCodes.OK },
  );
});
