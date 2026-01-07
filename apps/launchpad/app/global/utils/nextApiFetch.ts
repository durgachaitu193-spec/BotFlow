import fetchPonyfill from 'fetch-ponyfill'
import type { Network } from '@/global/types'
import { ERROR_MESSAGES } from './constants/errors'

export const { fetch: fetchPF } = fetchPonyfill()

interface Args {
  url: string
  data?: { [key: string]: unknown } | FormData
  method?: 'GET' | 'POST'
  network?: Network
}

async function nextApiFetch<T>({ url, data, method }: Args): Promise<{ data?: T; error?: string }> {
  const reqURL = url.startsWith('/') ? url.substring(1) : url

  const response = await fetch(`${window.location.origin}/${reqURL}`, {
    body: data instanceof FormData ? data : JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
    },
    method: method ?? (data ? 'POST' : 'GET'),
  })

  const resJSON = await response.json()

  if (response.status === 200)
    return {
      data: resJSON as T,
    }

  return {
    error: resJSON.message || ERROR_MESSAGES.API_FETCH_ERROR,
  }
}

export { nextApiFetch }
