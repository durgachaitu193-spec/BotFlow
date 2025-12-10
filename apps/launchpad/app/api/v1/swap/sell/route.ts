/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandling } from "@/api/v1/utils/withErrorHandling";
import { ERROR_CODES, ERROR_MESSAGES } from "@/global/utils/constants/errors";
import { StatusCodes } from "http-status-codes";
import { APIError } from "@/global/exceptions";
import { getBody } from "@/api/v1/utils/getBody";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { networkConstants } from "@/global/networkConstants";
import { getKeyringPairFromMnemonic } from "@/api/db/token/utils/getKeyringPairFromMnemonic";
import { BN } from "@polkadot/util";
import {
  calculateTotalCost,
  calculateTotalSellingCost,
  SCALING_FACTOR,
} from "@/lib/bounding-curve";
import { serverExecuteTx } from "../../utils/serverExecuteTx";
import { CURRENT_NETWORK, FEE_ADDRESS, SWAP_FEE } from "@/global/constants";
import { getSubstrateAddressFromMnemonic } from "@/api/db/token/utils/getSubstrateAddressFromMemonic";
import { getSubstrateAddress } from "@/global/utils/getSubstrateAddress";
import { db } from "@sim/db";
import {
  launchpadTokens,
  launchpadTransactions,
  launchpadHoldings,
} from "@sim/db/schema";
import { eq, and } from "drizzle-orm";

export const POST = withErrorHandling(async (req: NextRequest) => {
  const {
    blockHash,
    txIndex,
    txHash,
    id: tokenId,
    amount: tokenCount,
    address,
  } = await getBody(req);

  const id = `${tokenId}`;
  if (!txHash || !id || !tokenCount || !address || !blockHash || !txIndex) {
    throw new APIError(
      ERROR_CODES.INVALID_PARAMS_ERROR,
      StatusCodes.BAD_REQUEST,
      ERROR_MESSAGES.INVALID_PARAMS_ERROR,
    );
  }

  const tokenData = await db.query.launchpadTokens.findFirst({
    where: eq(launchpadTokens.id, id),
  });

  if (!tokenData) {
    throw new APIError(
      ERROR_CODES.TOKEN_NOT_FOUND_ERROR,
      StatusCodes.NOT_FOUND,
      ERROR_MESSAGES.TOKEN_NOT_FOUND_ERROR,
    );
  }

  const { mnemonic } = tokenData;

  if (!mnemonic) {
    throw new APIError(
      ERROR_CODES.INVALID_PARAMS_ERROR,
      StatusCodes.BAD_REQUEST,
      "Mnemonic not found for this token.",
    );
  }

  const curveAddress = (await getSubstrateAddressFromMnemonic(mnemonic)) || "";

  const provider = new WsProvider(
    networkConstants[CURRENT_NETWORK].rpcEndpoint,
  );
  const api = new ApiPromise({ provider });
  await api.isReady;
  const signedBlock = await api.rpc.chain.getBlock(blockHash);
  if (!signedBlock || !signedBlock.block) {
    throw new APIError(
      ERROR_CODES.NOT_FOUND,
      StatusCodes.NOT_FOUND,
      "Block not found, please provide a valid block hash.",
    );
  }
  const extrinsic =
    (signedBlock?.block?.extrinsics?.[
      Number(txIndex)
    ]?.toPrimitive?.() as any) || null;

  if (
    !extrinsic ||
    !extrinsic?.signature?.signer?.id ||
    !extrinsic.method?.args
  ) {
    throw new APIError(
      ERROR_CODES.NOT_FOUND,
      StatusCodes.NOT_FOUND,
      "Extrinsic not found or invalid.",
    );
  }

  const signerAddress = getSubstrateAddress(
    extrinsic.signature.signer.id || "",
  );

  if (!signerAddress || address !== signerAddress) {
    throw new APIError(
      ERROR_CODES.UNAUTHORIZED,
      StatusCodes.UNAUTHORIZED,
      "Unauthorized to execute this transaction, signer address does not match to authenticated user.",
    );
  }

  const txPayloads: any[] = [];
  if (extrinsic.method.args.calls?.length) {
    (extrinsic.method.args.calls as any[]).forEach((call) => {
      if (call?.args?.dest?.id) {
        if (call.args.dest.id === FEE_ADDRESS) {
          if (JSON.stringify(call.args.value) !== SWAP_FEE.toString()) {
            throw new APIError(
              ERROR_CODES.INVALID_PARAMS_ERROR,
              StatusCodes.BAD_REQUEST,
              "Invalid fee amount.",
            );
          }
        }
      }
      if (call?.args?.id && call.args.id === Number(tokenId)) {
        const recipientAddress = getSubstrateAddress(call.args.target.id);
        if (recipientAddress === curveAddress) {
          txPayloads.push({
            address: signerAddress,
            amount: new BN(String(call.args.amount)),
          });
        }
      }
    });
  }

  if (!txPayloads.length) {
    throw new APIError(
      ERROR_CODES.INVALID_PARAMS_ERROR,
      StatusCodes.BAD_REQUEST,
      "Invalid transaction payload.",
    );
  }

  if (txPayloads.length > 1) {
    throw new APIError(
      ERROR_CODES.INVALID_PARAMS_ERROR,
      StatusCodes.BAD_REQUEST,
      "Invalid transaction payload.",
    );
  }
  if (!txPayloads[0].address && !txPayloads[0].amount) {
    throw new APIError(
      ERROR_CODES.INVALID_PARAMS_ERROR,
      StatusCodes.BAD_REQUEST,
      "Invalid transaction payload.",
    );
  }
  try {
    await db.transaction(async (tx) => {
      const { amount, address } = txPayloads[0];
      const sellRequestedAmount = new BN(amount);

      const existingTx = await tx.query.launchpadTransactions.findFirst({
        where: eq(launchpadTransactions.userAddressTxHash, txHash),
      });

      if (existingTx) {
        throw new APIError(
          ERROR_CODES.TRANSACTION_ALREADY_EXISTS_ERROR,
          StatusCodes.BAD_REQUEST,
          ERROR_MESSAGES.TRANSACTION_ALREADY_EXISTS_ERROR,
        );
      }

      const currentTokenData = await tx.query.launchpadTokens.findFirst({
        where: eq(launchpadTokens.id, id),
      });

      if (!currentTokenData) {
        throw new APIError(
          ERROR_CODES.TOKEN_NOT_FOUND_ERROR,
          StatusCodes.NOT_FOUND,
          ERROR_MESSAGES.TOKEN_NOT_FOUND_ERROR,
        );
      }

      const { supply, mnemonic, reserveBalance, symbol } = currentTokenData;

      if (!mnemonic) {
        throw new APIError(
          ERROR_CODES.INVALID_PARAMS_ERROR,
          StatusCodes.BAD_REQUEST,
          "Mnemonic not found for this token.",
        );
      }

      const userHolding = await tx.query.launchpadHoldings.findFirst({
        where: and(
          eq(launchpadHoldings.walletAddress, address),
          eq(launchpadHoldings.tokenId, id),
        ),
      });

      const keyRing = await getKeyringPairFromMnemonic(mnemonic);
      const currentSupply = new BN(supply).sub(sellRequestedAmount);
      if (currentSupply.lt(new BN("0"))) {
        throw new APIError(
          ERROR_CODES.INVALID_PARAMS_ERROR,
          StatusCodes.BAD_REQUEST,
          "Invalid supply amount.",
        );
      }
      const { cost: transferMoney, reserveBalance: newReserveBalance } =
        calculateTotalSellingCost(
          new BN(supply),
          new BN(amount).div(SCALING_FACTOR),
          new BN(reserveBalance),
        );
      const { cost } = calculateTotalCost(
        currentSupply,
        new BN("1"),
        new BN(newReserveBalance),
      );
      const mainTx = api.tx.balances.transferKeepAlive(address, transferMoney);

      const onFailed = async () => {
        const keyring = await getKeyringPairFromMnemonic(mnemonic);
        const tx = api.tx.assets.transfer(id, address, sellRequestedAmount);
        await serverExecuteTx({
          tx,
          address: keyring,
          api,
          apiReady: true,
          network: CURRENT_NETWORK,
          params: {},
        });
        return NextResponse.json(
          { message: "failed: sending your money back" },
          { status: StatusCodes.INTERNAL_SERVER_ERROR },
        );
      };

      const txData = await serverExecuteTx({
        tx: mainTx,
        address: keyRing,
        api,
        apiReady: true,
        network: CURRENT_NETWORK,
        params: {},
        onFailed,
      });

      if (txData?.status && txData.status === "error") {
        throw new APIError(
          ERROR_CODES.TRANSACTION_ERROR,
          StatusCodes.INTERNAL_SERVER_ERROR,
          ERROR_MESSAGES.TRANSACTION_ERROR,
        );
      }

      const newTxHash = txData?.txHash;

      if (!newTxHash) {
        throw new APIError(
          ERROR_CODES.TRANSACTION_ERROR,
          StatusCodes.INTERNAL_SERVER_ERROR,
          "Transaction hash not found",
        );
      }

      const oldHoldingBalance = new BN(userHolding?.balance || "0");

      await tx
        .update(launchpadTokens)
        .set({
          supply: currentSupply.toString(),
          reserveBalance: newReserveBalance.toString(),
          currentPrice: cost.toString(),
        })
        .where(eq(launchpadTokens.id, id));

      await tx
        .update(launchpadHoldings)
        .set({
          balance: oldHoldingBalance.sub(sellRequestedAmount).toString(),
        })
        .where(
          and(
            eq(launchpadHoldings.walletAddress, address),
            eq(launchpadHoldings.tokenId, id),
          ),
        );

      await tx.insert(launchpadTransactions).values({
        txHash: newTxHash,
        tokenId: id,
        userAddressTxHash: txHash,
        symbol,
        amount: sellRequestedAmount.toString(),
        value: transferMoney.toString(),
        currentPrice: cost.toString(),
        type: "sell",
        from: keyRing.address,
        to: address,
        createdAt: new Date(),
        // Note: supply is not in launchpadTransactions schema, but was in original code.
        // I will omit it as it's not in the schema I saw.
      });
    });

    return NextResponse.json(
      { message: "success" },
      { status: StatusCodes.OK },
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "failed" },
      { status: StatusCodes.BAD_REQUEST },
    );
  }
});
