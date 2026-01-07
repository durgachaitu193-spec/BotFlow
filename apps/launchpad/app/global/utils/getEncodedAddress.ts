// Copyright 2019-2025 @blobscriptions/marketplace authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { encodeAddress } from '@polkadot/util-crypto'
import { networkConstants } from '@/global/networkConstants'
import type { Network } from '@/global/types'

/**
 * Return an address encoded for the current network
 *
 * @param address An address
 *
 */
export function getEncodedAddress(address: string, network: Network): string | null {
  const ss58Format = networkConstants?.[String(network)]?.ss58Format

  if (!network || ss58Format === undefined) {
    return null
  }
  try {
    if (address.startsWith('0x')) return address

    return encodeAddress(address, ss58Format)
  } catch (e) {
    return null
  }
}
