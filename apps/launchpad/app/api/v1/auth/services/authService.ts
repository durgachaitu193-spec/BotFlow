import { cryptoWaitReady, signatureVerify } from '@polkadot/util-crypto'
import { StatusCodes } from 'http-status-codes'
import { SIGN_MESSAGE } from '@/global/constants'
import { APIError } from '@/global/exceptions'
import type { IUser, Wallet } from '@/global/types'
import { ERROR_CODES } from '@/global/utils/constants/errors'
import { getSubstrateAddress } from '@/global/utils/getSubstrateAddress'

export async function login(address: string, wallet: Wallet, signature: string): Promise<IUser> {
  try {
    const substrateAddress = getSubstrateAddress(address)

    if (!substrateAddress) {
      throw new APIError(ERROR_CODES.INVALID_PARAMS_ERROR, StatusCodes.BAD_REQUEST)
    }

    await cryptoWaitReady()
    const { isValid } = signatureVerify(SIGN_MESSAGE, signature, substrateAddress)

    if (!isValid) {
      throw new APIError(ERROR_CODES.UNAUTHORIZED, StatusCodes.UNAUTHORIZED)
    }

    // Login successful, return user info without saving to DB (Firebase removed)
    return {
      wallet,
      address: substrateAddress,
    }
  } catch (error) {
    throw new APIError(ERROR_CODES.INTERNAL_SERVER_ERROR, StatusCodes.INTERNAL_SERVER_ERROR)
  }
}
