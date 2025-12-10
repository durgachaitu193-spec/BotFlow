'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Loader2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/emcn'
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@/components/emcn/components/modal/modal'
import { getTokensByChainId } from '@/lib/x402-tokens'
import { useX402Privy } from '@/hooks/use-x402-privy'

interface X402PaywallDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (paymentTxHash?: string) => void
}

export function X402PaywallDialog({ open, onOpenChange, onSuccess }: X402PaywallDialogProps) {
  const { payAndSettle } = useX402Privy()
  const [isPaying, setIsPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [selectedChainId, setSelectedChainId] = useState<number>(56) // Default to BNB Chain
  const [selectedToken, setSelectedToken] = useState<`0x${string}` | null>(null)
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [usdTarget, setUsdTarget] = useState<number | null>(null)
  const [amountDisplay, setAmountDisplay] = useState<string>('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const tokens = useMemo(() => getTokensByChainId(selectedChainId), [selectedChainId])

  // Check if selected token is native (BNB/ETH)
  const isNativeToken = useMemo(() => {
    if (!selectedToken) return false
    return selectedToken.toLowerCase() === '0x0000000000000000000000000000000000000000'
  }, [selectedToken])

  useEffect(() => {
    if (tokens.length > 0) {
      setSelectedToken(tokens[0].address)
    }
  }, [tokens])

  // Clear prices when switching chains
  useEffect(() => {
    setPrices({})
    setAmountDisplay('')
  }, [selectedChainId])

  const fetchPrices = async () => {
    if (tokens.length === 0) return

    setIsRefreshing(true)
    try {
      const symbols = tokens.map((t) => t.symbol).join(',')
      const res = await fetch(
        `/api/x402/prices?tokens=${encodeURIComponent(symbols)}&chainId=${selectedChainId}`,
        { cache: 'no-store' }
      )

      const map: Record<string, number> = {}
      if (res.ok) {
        const json = await res.json()
        if (typeof json?.usdTarget === 'number') {
          setUsdTarget(json.usdTarget)
        }
        const resp = (json?.prices || {}) as Record<string, { usd?: number }>
        Object.entries(resp).forEach(([sym, obj]) => {
          const token = tokens.find((t) => t.symbol === sym)
          if (!token) return
          const key = token.address.toLowerCase()
          if (typeof obj?.usd === 'number' && obj.usd > 0) {
            map[key] = obj.usd
          }
        })
      }
      setPrices(map)
    } catch {
      // swallow and rely on default amount
    } finally {
      setIsRefreshing(false)
    }
  }

  // Fetch prices when dialog opens and tokens/chain are ready
  useEffect(() => {
    if (!open || tokens.length === 0) return
    const timeoutId = setTimeout(() => {
      void fetchPrices()
    }, 100)
    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tokens.length, selectedChainId])

  // Compute human-readable amount display based on prices + usdTarget
  useEffect(() => {
    if (!selectedToken) {
      setAmountDisplay('')
      return
    }
    const price = prices[selectedToken.toLowerCase()]
    const symbol =
      tokens.find((t) => t.address === selectedToken)?.symbol ??
      (selectedChainId === 56 ? 'BNB' : 'ETH')

    if (price && price > 0 && usdTarget && usdTarget > 0) {
      const tokensNeeded = usdTarget / price
      const precision = 6
      setAmountDisplay(`${tokensNeeded.toFixed(precision)} ${symbol}`)
    } else {
      setAmountDisplay('')
    }
  }, [prices, selectedToken, tokens, usdTarget, selectedChainId])

  const appendLog = (msg: string) => {
    setLogs((prev) => [...prev, msg])
  }

  const handleConfirm = async () => {
    setError(null)
    setIsPaying(true)
    setLogs([])

    try {
      if (!selectedToken) {
        throw new Error('Please select a token')
      }

      const lower = selectedToken.toLowerCase()
      const priceUsd = prices[lower]

      const result = await payAndSettle(
        {
          tokenAddress: selectedToken,
          priceUsd,
        },
        appendLog,
        selectedChainId
      )
      // Extract transaction hash from result
      const paymentTxHash =
        (result as { txHash?: string; hash?: string })?.txHash ||
        (result as { txHash?: string; hash?: string })?.hash
      onSuccess(paymentTxHash)
    } catch (e: unknown) {
      const rawMessage =
        (e as { message?: string })?.message || 'Payment authorization failed. Please try again.'

      // Map noisy low-level messages to concise, user-friendly ones
      let friendly = rawMessage
      const lower = rawMessage.toLowerCase()

      if (lower.includes('user rejected') || lower.includes('user denied')) {
        friendly = 'You rejected the transaction in your wallet.'
      } else if (lower.includes('insufficient') && lower.includes('balance')) {
        friendly = 'Insufficient balance for this payment.'
      } else if (lower.includes('allowance')) {
        friendly = 'Token approval failed. Please retry the payment.'
      } else if (lower.includes('network') && lower.includes('chain')) {
        friendly = 'Please confirm the network switch in your wallet and try again.'
      } else {
        friendly = 'On-chain payment failed. Please check your wallet and try again.'
      }

      setError(friendly)
      appendLog(`❌ ${rawMessage}`)
    } finally {
      setIsPaying(false)
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className='w-[500px]'>
        <ModalHeader className='space-y-2'>
          <div className='inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand-primary-hex)]/10 text-[var(--brand-primary-hex)]'>
            <ShieldCheck className='h-5 w-5' />
          </div>
          <div className='text-base font-semibold'>
            {isNativeToken ? 'Payment Required' : 'x402 Sybil-Resistance Payment Required'}
          </div>
          <p className='text-xs text-[var(--text-tertiary)]'>
            {isNativeToken ? (
              <>
                Before deploying this workflow, authorize a small on-chain payment. This helps
                prevent sybil abuse while keeping your workflow trustless and non-custodial.
              </>
            ) : (
              <>
                Before deploying this workflow, authorize a small on-chain payment using the x402
                protocol. This helps prevent sybil abuse while keeping your workflow trustless and
                non-custodial.
              </>
            )}
          </p>
        </ModalHeader>

        <ModalBody>
          {error && (
            <div className='mb-3 rounded-lg border border-[var(--text-error)] bg-[var(--text-error)]/10 p-3'>
              <div className='flex items-start gap-2'>
                <AlertTriangle className='h-4 w-4 text-[var(--text-error)] mt-0.5' />
                <div>
                  <div className='text-xs font-semibold text-[var(--text-error)]'>
                    Payment error
                  </div>
                  <div className='text-xs text-[var(--text-error)]/90'>{error}</div>
                </div>
              </div>
            </div>
          )}

          {logs.length > 0 && (
            <div className='mb-3 max-h-28 overflow-y-auto rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-2'>
              <ul className='space-y-0.5 text-[11px] font-mono text-[var(--text-tertiary)]'>
                {logs.map((line, idx) => (
                  <li key={idx}>{line}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Network & token selection */}
          <div className='space-y-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4'>
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <div className='flex flex-wrap items-center gap-2'>
                {/* Only show BNB Chain - other networks kept for reference but hidden from UI */}
                <span className='rounded-full px-3 py-1 text-xs font-medium bg-[var(--brand-primary-hover-hex)] text-white'>
                  BNB Chain
                </span>
              </div>
              <Button
                type='button'
                variant='ghost'
                onClick={() => void fetchPrices()}
                disabled={isRefreshing || isPaying}
                className='h-7 px-2 text-[11px]'
              >
                {isRefreshing ? 'Refreshing…' : 'Refresh prices'}
              </Button>
            </div>

            <div className='flex flex-wrap gap-2'>
              {tokens.map((t) => {
                const checked = selectedToken === t.address
                return (
                  <button
                    key={t.address}
                    type='button'
                    onClick={() => setSelectedToken(t.address)}
                    className={`min-w-[80px] rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${checked
                        ? 'border-[var(--brand-primary-hover-hex)] bg-[var(--brand-primary-hover-hex)]/10 text-[var(--text-primary)]'
                        : 'border-[var(--border-primary)] bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)]'
                      }`}
                    disabled={isPaying}
                  >
                    {t.symbol}
                  </button>
                )
              })}
            </div>

            <div className='space-y-1 text-xs'>
              <div className='flex items-center justify-between'>
                <span className='text-[var(--text-tertiary)]'>Payment amount</span>
                <span className='font-medium'>
                  {amountDisplay || (usdTarget ? `≈ $${usdTarget}` : '—')}
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-[var(--text-tertiary)]'>Network</span>
                <span className='font-medium'>
                  {selectedChainId === 56
                    ? 'BNB Chain'
                    : selectedChainId === 8453
                      ? 'Base'
                      : 'Ethereum'}
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-[var(--text-tertiary)]'>Protocol</span>
                <span className='font-medium'>
                  {selectedToken &&
                    selectedToken.toLowerCase() === '0x0000000000000000000000000000000000000000'
                    ? 'Native'
                    : 'x402'}
                </span>
              </div>
            </div>
          </div>
        </ModalBody>

        <ModalFooter className='flex items-center justify-between gap-2'>
          <Button
            type='button'
            variant='outline'
            className='h-9 rounded-lg px-4 text-xs'
            disabled={isPaying}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type='button'
            onClick={handleConfirm}
            disabled={isPaying}
            className='h-9 rounded-lg px-4 text-xs font-medium text-white bg-[var(--brand-primary-hover-hex)] hover:bg-[var(--brand-primary-hover-hex)] shadow-[0_0_0_0_var(--brand-primary-hover-hex)] hover:shadow-[0_0_0_4px_rgba(127,47,255,0.15)] disabled:opacity-50'
          >
            {isPaying ? (
              <>
                <Loader2 className='mr-1.5 h-3.5 w-3.5 animate-spin' />
                Authorizing…
              </>
            ) : (
              'Authorize & Deploy'
            )}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
