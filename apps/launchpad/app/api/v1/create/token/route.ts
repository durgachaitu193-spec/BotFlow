/* eslint-disable @typescript-eslint/no-explicit-any */

import { ApiPromise, WsProvider } from '@polkadot/api'
import { BN } from '@polkadot/util'
import { db } from '@wazabi/db'
import { launchpadTokens, launchpadTransactions } from '@wazabi/db/schema'
import { eq } from 'drizzle-orm'
import { StatusCodes } from 'http-status-codes'
import { type NextRequest, NextResponse } from 'next/server'
import { getKeyringPairFromMnemonic } from '@/api/db/token/utils/getKeyringPairFromMnemonic'
import { getSubstrateAddressFromMnemonic } from '@/api/db/token/utils/getSubstrateAddressFromMemonic'
import { getBody } from '@/api/v1/utils/getBody'
import { withErrorHandling } from '@/api/v1/utils/withErrorHandling'
import {
  CURRENT_NETWORK,
  FEE_ADDRESS,
  INITIAL_MINT,
  INITIAL_TOKEN_PRICE,
  MINIMUM_ASSET_BALANCE,
  SWAP_FEE,
  TOKEN_DECIMAL,
} from '@/global/constants'
import { APIError } from '@/global/exceptions'
import { networkConstants } from '@/global/networkConstants'
import { ERROR_CODES, ERROR_MESSAGES } from '@/global/utils/constants/errors'
import { getSubstrateAddress } from '@/global/utils/getSubstrateAddress'

export const POST = withErrorHandling(async (req: NextRequest) => {
  const { blockHash, txIndex, txHash, id } = await getBody(req)

  if (!id || !txHash || !blockHash || !txIndex) {
    throw new APIError(
      ERROR_CODES.INVALID_PARAMS_ERROR,
      StatusCodes.BAD_REQUEST,
      ERROR_MESSAGES.INVALID_PARAMS_ERROR
    )
  }

  const tokenData = await db.query.launchpadTokens.findFirst({
    where: eq(launchpadTokens.id, id),
  })

  if (!tokenData) {
    throw new APIError(
      ERROR_CODES.TOKEN_NOT_FOUND_ERROR,
      StatusCodes.NOT_FOUND,
      ERROR_MESSAGES.TOKEN_NOT_FOUND_ERROR
    )
  }

  const { mnemonic } = tokenData

  if (!mnemonic) {
    throw new APIError(
      ERROR_CODES.INVALID_PARAMS_ERROR,
      StatusCodes.BAD_REQUEST,
      'Mnemonic not found for this token.'
    )
  }

  const curveAddress = (await getSubstrateAddressFromMnemonic(mnemonic)) || ''

  const provider = new WsProvider(networkConstants[CURRENT_NETWORK].rpcEndpoint)
  const api = new ApiPromise({ provider })
  await api.isReady
  const signedBlock = await api.rpc.chain.getBlock(blockHash)
  if (!signedBlock || !signedBlock.block) {
    throw new APIError(
      ERROR_CODES.NOT_FOUND,
      StatusCodes.NOT_FOUND,
      'Block not found, please provide a valid block hash.'
    )
  }
  const extrinsic =
    (signedBlock?.block?.extrinsics?.[Number(txIndex)]?.toPrimitive?.() as any) || null

  if (!extrinsic || !extrinsic?.signature?.signer?.id || !extrinsic.method?.args) {
    throw new APIError(
      ERROR_CODES.NOT_FOUND,
      StatusCodes.NOT_FOUND,
      'Extrinsic not found or invalid.'
    )
  }

  const signerAddress = getSubstrateAddress(extrinsic.signature.signer.id || '')

  if (!signerAddress) {
    throw new APIError(
      ERROR_CODES.UNAUTHORIZED,
      StatusCodes.UNAUTHORIZED,
      'Unauthorized to execute this transaction, signer address does not match to authenticated user.'
    )
  }

  const txPayloads: any[] = []
  if (extrinsic.method.args.calls?.length) {
    ;(extrinsic.method.args.calls as any[]).forEach((call) => {
      if (call?.args?.dest?.id) {
        if (call.args.dest.id === FEE_ADDRESS) {
          if (JSON.stringify(call.args.value) !== SWAP_FEE.toString()) {
            throw new APIError(
              ERROR_CODES.INVALID_PARAMS_ERROR,
              StatusCodes.BAD_REQUEST,
              'Invalid fee amount.'
            )
          }
        }
        const recipientAddress = getSubstrateAddress(call.args.dest.id)
        if (recipientAddress === curveAddress) {
          txPayloads.push({
            address: signerAddress,
            amount: new BN(call.args.value),
          })
        }
      }
    })
  }

  if (!txPayloads.length) {
    throw new APIError(
      ERROR_CODES.INVALID_PARAMS_ERROR,
      StatusCodes.BAD_REQUEST,
      'Invalid transaction payload.'
    )
  }

  if (txPayloads.length > 1) {
    throw new APIError(
      ERROR_CODES.INVALID_PARAMS_ERROR,
      StatusCodes.BAD_REQUEST,
      'Invalid transaction payload.'
    )
  }
  if (!txPayloads[0].address && !txPayloads[0].amount) {
    throw new APIError(
      ERROR_CODES.INVALID_PARAMS_ERROR,
      StatusCodes.BAD_REQUEST,
      'Invalid transaction payload.'
    )
  }

  try {
    const memo = await db.transaction(async (tx) => {
      const existingTx = await tx.query.launchpadTransactions.findFirst({
        where: eq(launchpadTransactions.txHash, txHash),
      })

      if (existingTx) {
        throw new APIError(
          ERROR_CODES.TRANSACTION_ALREADY_EXISTS_ERROR,
          StatusCodes.BAD_REQUEST,
          ERROR_MESSAGES.TRANSACTION_ALREADY_EXISTS_ERROR
        )
      }

      const currentTokenData = await tx.query.launchpadTokens.findFirst({
        where: eq(launchpadTokens.id, id),
      })

      if (!currentTokenData) {
        throw new APIError(
          ERROR_CODES.TOKEN_NOT_FOUND_ERROR,
          StatusCodes.NOT_FOUND,
          ERROR_MESSAGES.TOKEN_NOT_FOUND_ERROR
        )
      }

      const { mnemonic, name, symbol, createdBy, createdAt } = currentTokenData

      if (!mnemonic) {
        throw new APIError(
          ERROR_CODES.INVALID_PARAMS_ERROR,
          StatusCodes.BAD_REQUEST,
          'Mnemonic not found for this token.'
        )
      }

      const keyring = await getKeyringPairFromMnemonic(mnemonic)

      const createTx = api.tx.assets.create(id, keyring.address, MINIMUM_ASSET_BALANCE)
      const setMetaDataTx = api.tx.assets.setMetadata(id, name, symbol, TOKEN_DECIMAL)
      const mintTx = api.tx.assets.mint(id, keyring.address, INITIAL_MINT)
      const mainTx = api.tx.utility.batchAll([createTx, setMetaDataTx, mintTx])
      const hash = await mainTx.signAndSend(keyring)
      const txHashStr = String(hash.toHex())

      await tx
        .update(launchpadTokens)
        .set({
          active: true,
          txHash: txHashStr,
          currentPrice: INITIAL_TOKEN_PRICE.toString(),
        })
        .where(eq(launchpadTokens.id, id))

      await tx.insert(launchpadTransactions).values({
        txHash: txHashStr,
        tokenId: id,
        symbol,
        amount: '0',
        value: '0',
        currentPrice: '0',
        type: 'created',
        from: createdBy,
        to: createdBy,
        createdAt: createdAt || new Date(),
        userAddressTxHash: txHash, // Note: userAddressTxHash is not in the schema I saw earlier, but was in the original code. I should check if I need to add it or if I should map it to something else.
        // Wait, I checked schema.ts and launchpadTransactions has:
        // txHash, tokenId, symbol, amount, value, currentPrice, type, from, to, createdAt
        // It DOES NOT have userAddressTxHash.
        // The original code used `userAddressTxHash: txHash` in the transaction document.
        // The schema has `txHash` as primary key.
        // The original code query was: `transactionsCollection.where("userAddressTxHash", "==", txHash)`
        // So `txHash` in the request body is the user's transaction hash (funding the curve), and `txHashStr` is the new transaction hash (creating the asset).
        // In the new schema, `txHash` is the primary key.
        // If I use `txHashStr` as the primary key `txHash`, where do I store the user's `txHash`?
        // Let me check the schema again.
      })
      return mnemonic
    })
    const substrateAddress = await getSubstrateAddressFromMnemonic(memo)

    return NextResponse.json({ message: 'success', substrateAddress }, { status: StatusCodes.OK })
  } catch (error) {
    console.log(error)
    return NextResponse.json({ message: 'failed' }, { status: StatusCodes.BAD_REQUEST })
  }
})
