// Copyright 2019-2025 @blobscriptions/marketplace authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { ERROR_CODES, ERROR_MESSAGES } from '@/global/utils/constants/errors'

export async function getBody(req: Request) {
  try {
    return req.json()
  } catch (error) {
    console.log(ERROR_MESSAGES.REQ_BODY_ERROR, 500, ERROR_CODES.REQ_BODY_ERROR)
    return {}
  }
}
