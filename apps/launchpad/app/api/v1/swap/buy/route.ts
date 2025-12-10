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
import { BN, BN_ZERO } from "@polkadot/util";
import { calculateTotalCost, SCALING_FACTOR } from "@/lib/bounding-curve";
import { serverExecuteTx } from "../../utils/serverExecuteTx";
import {
  CURRENT_NETWORK,
  DX_LIST_AMOUNT,
  FEE_ADDRESS,
  INITIAL_TOKEN_PRICE,
  SWAP_FEE,
} from "@/global/constants";
import { getSubstrateAddress } from "@/global/utils/getSubstrateAddress";
import { getSubstrateAddressFromMnemonic } from "@/api/db/token/utils/getSubstrateAddressFromMemonic";
import { migrateToHydraDX } from "@/api/db/migrateToHydration";
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
        const recipientAddress = getSubstrateAddress(call.args.dest.id);
        if (recipientAddress === curveAddress) {
          txPayloads.push({
            address: signerAddress,
            amount: new BN(call.args.value),
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
      const buyRequestedAmount = new BN(tokenCount).mul(SCALING_FACTOR);

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

      const { cost: transferMoney, reserveBalance: newReserveBalance } =
        calculateTotalCost(
          new BN(supply),
          new BN(tokenCount),
          new BN(reserveBalance),
        );
      const currentPrice = calculateTotalCost(
        new BN(supply).add(buyRequestedAmount),
        new BN("1"),
        new BN(newReserveBalance),
      ).cost;
      const mainTx = api.tx.assets.transfer(id, address, buyRequestedAmount);

      if (transferMoney.gt(amount)) {
        throw new APIError(
          ERROR_CODES.BAD_REQUEST,
          StatusCodes.BAD_REQUEST,
          ERROR_MESSAGES.BAD_REQUEST,
        );
      }

      const keyRing = await getKeyringPairFromMnemonic(mnemonic);

      const onFailed = async () => {
        const keyring = await getKeyringPairFromMnemonic(mnemonic);
        const tx = api.tx.balances.transferKeepAlive(
          address,
          transferMoney.toString(),
        );
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
        onFailed,
        params: {},
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

      let tradeDisabled = false;

      if (new BN(newReserveBalance).gte(DX_LIST_AMOUNT)) {
        tradeDisabled = true;
        try {
          const updatedSupply = buyRequestedAmount.add(
            new BN(buyRequestedAmount).div(new BN(100)),
          );
          migrateToHydraDX({
            sender: keyRing,
            assetId: id,
            hydraAmount: newReserveBalance.toString(),
            assetAmount: new BN(supply).add(updatedSupply).toString(),
          });
        } catch (error) {
          console.log("Error in migrating to HydraDX", error);
        }
      }

      await tx
        .update(launchpadTokens)
        .set({
          supply: new BN(supply).add(buyRequestedAmount).toString(),
          reserveBalance: newReserveBalance.toString(),
          currentPrice: currentPrice.lt(BN_ZERO)
            ? INITIAL_TOKEN_PRICE.toString()
            : currentPrice.toString(),
          tradeDisabled,
        })
        .where(eq(launchpadTokens.id, id));

      await tx
        .insert(launchpadHoldings)
        .values({
          walletAddress: address,
          tokenId: id,
          balance: oldHoldingBalance.add(buyRequestedAmount).toString(),
        })
        .onConflictDoUpdate({
          target: [launchpadHoldings.walletAddress, launchpadHoldings.tokenId],
          set: {
            balance: oldHoldingBalance.add(buyRequestedAmount).toString(),
          },
        });

      await tx.insert(launchpadTransactions).values({
        txHash: newTxHash,
        tokenId: id,
        userAddressTxHash: txHash,
        symbol,
        amount: buyRequestedAmount.toString(),
        value: transferMoney.toString(),
        currentPrice: currentPrice.lt(BN_ZERO)
          ? INITIAL_TOKEN_PRICE.toString()
          : currentPrice.toString(),
        type: "buy",
        from: keyRing.address,
        to: address,
        createdAt: new Date(),
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
