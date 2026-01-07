/* eslint-disable @typescript-eslint/no-explicit-any */
// Copyright 2019-2025 @blobscriptions/marketplace authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { type NextRequest, NextResponse } from 'next/server'

export const withErrorHandling = (
  handler: (req: NextRequest, options?: any) => Promise<NextResponse>
) => {
  return async (req: NextRequest, options?: any) => {
    try {
      return await handler(req, options)
    } catch (error) {
      const err = error as any
      console.log('Error in API call : ', req.nextUrl)
      console.log(JSON.stringify({ err }))
      return NextResponse.json({ ...err, message: err.message }, { status: err.status })
    }
  }
}
