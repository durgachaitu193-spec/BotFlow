import { BN } from '@polkadot/util'
import { Network } from './types'

export const APP_NAME = 'Only.Fun'
export const SIGN_MESSAGE = 'Login to Only.Fun'
export const MINIMUM_ASSET_BALANCE = 1
export const TOKEN_DECIMAL = 8
export const INITIAL_MINT = new BN('100000000000000000')
export const CREATION_FEE = new BN('5000000000')
export const DEFAULT_PAGE_NUMBER = 1
export const PAGINATION_LISTING_LIMIT = 50
export const DX_LIST_AMOUNT = new BN(1000).mul(new BN(10).pow(new BN(10)))
export const OG_AMOUNT = new BN(500).mul(new BN(10).pow(new BN(10)))
export const SWAP_FEE = new BN('1000000000')
// export const DX_LIST_AMOUNT = new BN("1000000000");
// export const OG_AMOUNT = new BN("500000000");
// export const SWAP_FEE = new BN("10000");
export const TOTAL_SUPPLY = new BN('1000000000')
export const FEE_ADDRESS = '16SPgBHQbe5kLGZPajNRLCAXunYgkRoybMZqNiKtX3c3iZnH'
export const CURRENT_NETWORK = Network.BNB
export const INITIAL_TOKEN_PRICE = new BN('25600')

export const LISTING_MNEMONIC = process.env.HDX_LISTING_ACCOUNT
export const BUILDER_URL = process.env.NEXT_PUBLIC_BUILDER_URL || 'http://localhost:3001'
export const LAUNCHPAD_URL = process.env.NEXT_PUBLIC_LAUNCHPAD_URL || 'http://localhost:3000'
