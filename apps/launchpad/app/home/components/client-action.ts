import type { IToken } from '@/global/types'
import { nextApiFetch } from '@/global/utils/nextApiFetch'

export const getTokens = async (): Promise<{
  data?: { tokens: Array<IToken> }
  error?: string
}> => {
  return nextApiFetch({
    url: 'api/v1/token',
    method: 'GET',
  })
}
