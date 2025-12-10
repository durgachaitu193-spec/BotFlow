import { NextRequest, NextResponse } from "next/server";
import { withErrorHandling } from "@/api/v1/utils/withErrorHandling";
import { ERROR_CODES, ERROR_MESSAGES } from "@/global/utils/constants/errors";
import { StatusCodes } from "http-status-codes";
import { getBody } from "@/api/v1/utils/getBody";
import { getSubstrateAddress } from "@/global/utils/getSubstrateAddress";
import { APIError } from "@/global/exceptions";
import { login } from "../services/authService";

export const POST = withErrorHandling(async (req: NextRequest) => {
  const { address = "", wallet = "", signature = "" } = await getBody(req);

  const substrateAddress = getSubstrateAddress(address);
  if (!substrateAddress || !wallet || !signature) {
    throw new APIError(
      ERROR_CODES.INVALID_PARAMS_ERROR,
      StatusCodes.BAD_REQUEST,
      ERROR_MESSAGES.INVALID_PARAMS_ERROR,
    );
  }

  const data = await login(substrateAddress, wallet, signature);

  return NextResponse.json(data, { status: StatusCodes.OK });
});
