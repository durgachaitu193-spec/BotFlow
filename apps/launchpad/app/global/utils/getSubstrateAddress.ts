// Copyright 2019-2025 @blobscriptions/marketplace authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { encodeAddress } from '@polkadot/util-crypto'

/**
 * Return an address encoded for the current network
 *
 * @param address An address
 *
 */
export function getSubstrateAddress(address: string): string | null {
  try {
    if (address?.startsWith?.('0x')) return address

    return encodeAddress(address, 42)
  } catch (e) {
    return null
  }
}
