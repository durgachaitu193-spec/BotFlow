'use client'

import { useState } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { createLogger } from '@sim/logger'
import { AlertTriangle, Loader2, X } from 'lucide-react'
import { Button, Input, Label } from '@/components/emcn'
import { Alert, AlertDescription } from '@/components/ui'
import { createTokenForAgent } from '@/lib/contracts/tokenFactory'
import { updateAgentMetadata } from '@/lib/contracts/agentRegistry'
import { buildAgentMetadata, type AgentMetadata } from '@/lib/contracts/agentMetadata'

const logger = createLogger('TokenDeploy')

interface TokenDeployProps {
  workflowId: string
  agentData: {
    agentId: string
    agentDID: string
    transactionHash: string
    metadata: AgentMetadata
  } | null
  isSubmitting: boolean
  setIsSubmitting: (submitting: boolean) => void
  onTokenCreated?: () => Promise<void>
}

export function TokenDeploy({
  workflowId,
  agentData,
  isSubmitting,
  setIsSubmitting,
  onTokenCreated,
}: TokenDeployProps) {
  const { wallets } = useWallets()
  const [tokenName, setTokenName] = useState('')
  const [tokenSymbol, setTokenSymbol] = useState('')
  const [tokenImage, setTokenImage] = useState<File | null>(null)
  const [tokenImagePreview, setTokenImagePreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleTokenImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB')
      return
    }

    setTokenImage(file)
    setError(null)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setTokenImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveTokenImage = () => {
    setTokenImage(null)
    setTokenImagePreview(null)
  }

  const handleTokenSymbolChange = (value: string) => {
    // Only allow uppercase letters and numbers, max 10 characters
    const sanitized = value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 10)
    setTokenSymbol(sanitized)
  }

  const isFormValid =
    Boolean(tokenName.trim()) &&
    Boolean(tokenSymbol.trim()) &&
    Boolean(tokenImage) &&
    Boolean(agentData)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isFormValid || !agentData) {
      setError('Please fill in all required fields and ensure agent is registered')
      return
    }

    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      const walletAddress = wallets?.[0]?.address
      if (!walletAddress) {
        throw new Error('Wallet address required. Please connect your wallet.')
      }

      let provider: any = null
      try {
        if (wallets && wallets.length > 0) {
          provider = await wallets[0].getEthereumProvider()
        }
      } catch (error) {
        logger.error('Error getting wallet provider:', error)
        throw new Error('Failed to get wallet provider')
      }

      if (!provider) {
        throw new Error('Wallet provider required. Please connect your wallet.')
      }

      // Upload token image to IPFS
      let ipfsHash = ''
      try {
        const formData = new FormData()
        formData.append('tokenName', tokenName)
        formData.append('tokenSymbol', tokenSymbol)
        formData.append('file', tokenImage!)

        const ipfsResponse = await fetch('/api/ipfs/upload', {
          method: 'POST',
          body: formData,
        })

        if (ipfsResponse.ok) {
          const ipfsData = await ipfsResponse.json()
          ipfsHash = ipfsData.ipfsHash
          logger.info('IPFS hash obtained', { ipfsHash })
        } else {
          throw new Error('Failed to upload token image to IPFS')
        }
      } catch (ipfsError) {
        logger.error('Error uploading to IPFS:', ipfsError)
        throw new Error('Failed to upload token image. Please try again.')
      }

      // Create token for existing agent
      logger.info('Creating token for agent', {
        agentId: agentData.agentId,
        tokenName,
        tokenSymbol,
      })

      const tokenResult = await createTokenForAgent(
        walletAddress,
        agentData.agentId,
        tokenName,
        tokenSymbol,
        ipfsHash,
        provider
      )

      if (!tokenResult || !tokenResult.tokenAddress) {
        throw new Error('Token creation failed: no result returned')
      }

      logger.info('Token created successfully', {
        agentId: agentData.agentId,
        tokenAddress: tokenResult.tokenAddress,
        txHash: tokenResult.txHash,
      })

      // Update agent metadata with token details
      const updatedMetadata: AgentMetadata = {
        ...agentData.metadata,
        tokenName,
        tokenSymbol,
        tokenAddress: tokenResult.tokenAddress,
        tokenImageIpfsHash: ipfsHash,
      }

      try {
        const updateResult = await updateAgentMetadata(
          walletAddress,
          agentData.agentId,
          buildAgentMetadata(updatedMetadata),
          provider
        )

        if (updateResult) {
          logger.info('Agent metadata updated with token details', {
            txHash: updateResult.txHash,
          })
        }

        // Update in database
        await fetch(`/api/agents?agentId=${agentData.agentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            metadata: updatedMetadata,
          }),
        })

        logger.info('Token creation and agent update completed successfully')
        setSuccess(true)

        // Call callback to refresh agent data
        if (onTokenCreated) {
          await onTokenCreated()
        }
      } catch (updateError) {
        logger.error('Error updating agent metadata:', updateError)
        // Token was created successfully, but metadata update failed
        // This is non-critical, but we should still show success
        setSuccess(true)
        setError(
          'Token created successfully, but failed to update agent metadata. Token address: ' +
            tokenResult.tokenAddress
        )
      }
    } catch (error: any) {
      logger.error('Error creating token:', error)
      setError(error.message || 'Failed to create token. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!agentData) {
    return (
      <div className='flex flex-col items-center justify-center py-12 text-center'>
        <p className='text-muted-foreground text-sm'>
          Agent must be registered before creating a token. Deploy API first to register an agent.
        </p>
      </div>
    )
  }

  // Check if agent already has a token
  const hasToken = Boolean(agentData.metadata?.tokenAddress)

  return (
    <form
      id='token-deploy-form'
      onSubmit={handleSubmit}
      className='-mx-1 space-y-4 overflow-y-auto px-1'
    >
      {error && (
        <Alert variant='destructive'>
          <AlertTriangle className='h-4 w-4' />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && !error && (
        <Alert>
          <AlertDescription>
            Token created successfully! Agent metadata has been updated with token details.
          </AlertDescription>
        </Alert>
      )}

      {hasToken && (
        <Alert>
          <AlertDescription>
            This agent already has a token: {agentData.metadata.tokenAddress}
          </AlertDescription>
        </Alert>
      )}

      <div className='space-y-[12px]'>
        <div>
          <Label
            htmlFor='tokenName'
            className='mb-[6.5px] block pl-[2px] font-medium text-[13px] text-[var(--text-primary)]'
          >
            Token Name <span className='text-red-500'>*</span>
          </Label>
          <Input
            id='tokenName'
            placeholder='e.g., My Agent Token'
            value={tokenName}
            onChange={(e) => setTokenName(e.target.value)}
            disabled={isSubmitting || hasToken}
            className='h-[32px] text-[13px]'
            required
          />
        </div>

        <div>
          <Label
            htmlFor='tokenSymbol'
            className='mb-[6.5px] block pl-[2px] font-medium text-[13px] text-[var(--text-primary)]'
          >
            Token Symbol <span className='text-red-500'>*</span>
          </Label>
          <Input
            id='tokenSymbol'
            placeholder='e.g., AGT'
            value={tokenSymbol}
            onChange={(e) => handleTokenSymbolChange(e.target.value)}
            disabled={isSubmitting || hasToken}
            className='h-[32px] text-[13px]'
            maxLength={10}
            required
          />
          <p className='mt-[4px] text-[10px] text-[var(--text-tertiary)]'>
            Max 10 characters, uppercase
          </p>
        </div>

        <div>
          <Label className='mb-[6.5px] block pl-[2px] font-medium text-[12px] text-[var(--text-primary)]'>
            Token Image <span className='text-red-500'>*</span>
          </Label>

          {tokenImagePreview ? (
            <div className='flex items-center gap-[12px]'>
              <div className='relative h-[80px] w-[80px] overflow-hidden rounded-[8px] border border-[var(--border-primary)]'>
                <img
                  src={tokenImagePreview}
                  alt='Token preview'
                  className='h-full w-full object-cover'
                />
              </div>
              <div className='flex flex-col gap-[8px]'>
                <p className='text-[12px] text-[var(--text-secondary)]'>{tokenImage?.name}</p>
                <Button
                  type='button'
                  variant='outline'
                  onClick={handleRemoveTokenImage}
                  disabled={isSubmitting || hasToken}
                  className='h-[28px] text-[11px]'
                >
                  <X className='mr-1 h-3 w-3' />
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <input
                type='file'
                id='tokenImageInput'
                accept='image/*'
                onChange={handleTokenImageSelect}
                disabled={isSubmitting || hasToken}
                className='hidden'
              />
              <label htmlFor='tokenImageInput'>
                <Button
                  type='button'
                  variant='outline'
                  disabled={isSubmitting || hasToken}
                  className='h-[32px] cursor-pointer text-[12px]'
                  onClick={(e) => {
                    e.preventDefault()
                    document.getElementById('tokenImageInput')?.click()
                  }}
                >
                  Upload Image
                </Button>
              </label>
              <p className='mt-[4px] text-[10px] text-[var(--text-tertiary)]'>
                PNG, JPG or GIF (max 5MB)
              </p>
            </div>
          )}
        </div>
      </div>
    </form>
  )
}
