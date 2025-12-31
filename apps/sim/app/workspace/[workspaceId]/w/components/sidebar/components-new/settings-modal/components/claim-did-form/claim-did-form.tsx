'use client'

import { useEffect, useState } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Loader2 } from 'lucide-react'
import { type Chain, createPublicClient, createWalletClient, custom, http } from 'viem'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  BSC_MAINNET,
  BSC_TESTNET,
  DEFAULT_CHAIN,
  DID_REGISTRY_ABI,
  DID_REGISTRY_ADDRESS,
} from '@/lib/contracts/didRegistry'
import { fetchDIDForAddress } from '@/lib/did/utils'
import { createLogger } from '@sim/logger'
import { cn } from '@/lib/utils'
import { inter } from '@/app/_styles/fonts/inter/inter'
import { soehne } from '@/app/_styles/fonts/soehne/soehne'

const logger = createLogger('ClaimDidForm')

interface ClaimDidFormProps {
  onSuccess: () => void
}

export function ClaimDidForm({ onSuccess }: ClaimDidFormProps) {
  const { authenticated, user, connectWallet } = usePrivy()
  const { wallets, ready } = useWallets()

  const [isClaiming, setIsClaiming] = useState(false)
  const [claimStatus, setClaimStatus] = useState<string | null>(null)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [step, setStep] = useState<'initial' | 'username' | 'success'>('initial')
  const [username, setUsername] = useState('')
  const [currentChainId, setCurrentChainId] = useState<number | null>(null)
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false)
  const [selectedChain, setSelectedChain] = useState<Chain>(DEFAULT_CHAIN)
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [transactionHash, setTransactionHash] = useState<string | null>(null)
  const [copiedAddress, setCopiedAddress] = useState(false)
  const [checkError, setCheckError] = useState<string | null>(null)

  const hasWallets = ready && wallets.length > 0

  // Update wallet address when wallets or user changes
  useEffect(() => {
    if (wallets && wallets.length > 0 && wallets[0]?.address) {
      setWalletAddress(wallets[0].address)
    } else if (user?.wallet?.address) {
      const address =
        typeof user.wallet.address === 'string'
          ? user.wallet.address
          : (user.wallet.address as any)?.address || null
      setWalletAddress(address)
    } else {
      setWalletAddress(null)
    }
  }, [wallets, user])

  // Check for existing DID
  useEffect(() => {
    const checkDID = async () => {
      if (walletAddress && selectedChain) {
        try {
          const { did, username: fetchedUsername } = await fetchDIDForAddress(walletAddress, selectedChain)
          if (did) {
            logger.info('User already has DID, updating profile...', { did })

            // Update DB to ensure profile stays in sync
            try {
              await fetch('/api/users/me/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userDID: did,
                  name: fetchedUsername || undefined,
                }),
              })
            } catch (updateError) {
              logger.error('Error updating profile with existing DID:', updateError)
            }

            setStep('success')
          }
        } catch (error) {
          logger.error('Error checking existing DID:', error)
        }
      }
    }

    if (authenticated && walletAddress) {
      checkDID()
    }
  }, [walletAddress, selectedChain, authenticated, onSuccess])

  // Check current network when wallet is available
  useEffect(() => {
    const checkNetwork = async () => {
      if (wallets && wallets.length > 0) {
        try {
          const wallet = wallets[0]
          const provider = await wallet.getEthereumProvider()
          if (provider) {
            const chainId = await provider.request({ method: 'eth_chainId' })
            const chainIdNumber = Number.parseInt(chainId as string, 16)
            setCurrentChainId(chainIdNumber)

            if (chainIdNumber === BSC_TESTNET.id) {
              setSelectedChain(BSC_TESTNET)
            } else if (chainIdNumber === BSC_MAINNET.id) {
              setSelectedChain(BSC_MAINNET)
            }
          }
        } catch (error) {
          logger.error('Error checking network:', error)
        }
      }
    }

    if (authenticated && wallets.length > 0) {
      checkNetwork()
    }
  }, [authenticated, wallets])

  // Listen for network changes
  useEffect(() => {
    let cleanup: (() => void) | undefined

    const setupNetworkListener = async () => {
      if (wallets && wallets.length > 0) {
        try {
          const wallet = wallets[0]
          const provider = await wallet.getEthereumProvider()
          if (provider && typeof provider.on === 'function') {
            const handleChainChanged = (chainId: string | number) => {
              const chainIdString =
                typeof chainId === 'string' ? chainId : `0x${chainId.toString(16)}`
              const chainIdNumber = Number.parseInt(chainIdString, 16)
              setCurrentChainId(chainIdNumber)

              if (chainIdNumber === BSC_TESTNET.id) {
                setSelectedChain(BSC_TESTNET)
                setCheckError(null)
              } else if (chainIdNumber === BSC_MAINNET.id) {
                setSelectedChain(BSC_MAINNET)
                setCheckError(null)
              }
            }

            provider.on('chainChanged', handleChainChanged as any)

            cleanup = () => {
              if (provider && typeof provider.removeListener === 'function') {
                provider.removeListener('chainChanged', handleChainChanged as any)
              }
            }
          }
        } catch (error) {
          logger.error('Error setting up network listener:', error)
        }
      }
    }

    if (authenticated && wallets.length > 0) {
      setupNetworkListener()
    }

    return () => {
      if (cleanup) {
        cleanup()
      }
    }
  }, [authenticated, wallets])

  const switchNetwork = async (targetChain: Chain): Promise<boolean> => {
    if (!wallets || wallets.length === 0) {
      throw new Error('No wallet found')
    }

    if (currentChainId === targetChain.id) {
      setSelectedChain(targetChain)
      return true
    }

    setIsSwitchingNetwork(true)
    try {
      const wallet = wallets[0]

      try {
        await wallet.switchChain(targetChain.id)
      } catch (switchError: any) {
        // If switchChain fails, try the provider method directly
        const provider = await wallet.getEthereumProvider()
        if (provider) {
          try {
            await provider.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: `0x${targetChain.id.toString(16)}` }],
            })
          } catch (providerError: any) {
            // This error code indicates that the chain has not been added to MetaMask.
            if (providerError.code === 4902 || providerError.code === -32603) {
              await provider.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: `0x${targetChain.id.toString(16)}`,
                    chainName: targetChain.name,
                    nativeCurrency: {
                      name: targetChain.nativeCurrency.name,
                      symbol: targetChain.nativeCurrency.symbol,
                      decimals: targetChain.nativeCurrency.decimals,
                    },
                    rpcUrls: targetChain.rpcUrls.default.http,
                    blockExplorerUrls: targetChain.blockExplorers?.default?.url
                      ? [targetChain.blockExplorers.default.url]
                      : [],
                  },
                ],
              })
            } else {
              // Proceed if it's just an unsupported chain ID error from the wallet wrapper
              if (providerError.message?.includes('Unsupported chainId')) {
                console.warn(`Network ${targetChain.name} may not be fully supported by wallet wrapper, but proceeding.`)
              } else {
                throw providerError
              }
            }
          }
        } else {
          // Re-throw if no provider and standard switch failed
          if (!switchError.message?.includes('Unsupported chainId')) {
            throw switchError
          }
        }
      }

      // Refresh chain ID after switch
      const provider = await wallet.getEthereumProvider()
      if (provider) {
        const chainId = await provider.request({ method: 'eth_chainId' })
        const chainIdNumber = Number.parseInt(chainId as string, 16)
        setCurrentChainId(chainIdNumber)
      }
      setSelectedChain(targetChain)
      setCheckError(null)
      return true
    } catch (error: any) {
      logger.error('Network switch error:', error)
      // Even if it fails, if the user explicitly clicked it, we might want to select it
      // but let's warn them.
      if (error.message?.includes('Unsupported chainId') || error.message?.includes('User rejected')) {
        // User rejected, do nothing or show toast
        return false
      } else {
        // Some wallets throw errors even on success or partial success with custom chains
        return false
      }
    } finally {
      setIsSwitchingNetwork(false)
    }
  }

  // Debounced username availability check
  useEffect(() => {
    if (!username.trim()) {
      setUsernameAvailable(null)
      return
    }

    setIsCheckingUsername(true)
    setCheckError(null)
    const timeoutId = setTimeout(async () => {
      try {
        const trimmedUsername = username.trim()
        const chainParam = selectedChain.id === BSC_MAINNET.id ? 'mainnet' : 'testnet'

        const response = await fetch(
          `/api/did/username/check?username=${encodeURIComponent(trimmedUsername)}&chain=${chainParam}`
        )

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.details || errorData.error || 'Failed to check username availability')
        }

        const data = await response.json()
        const available = data.available === true

        setUsernameAvailable(available)
      } catch (error: any) {
        logger.error('Error checking username:', error)
        setUsernameAvailable(null)
        setCheckError(error.message || 'Error checking username')
      } finally {
        setIsCheckingUsername(false)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [username, selectedChain])

  const handleCreateDIDClick = async () => {
    if (wallets && wallets.length > 0) {
      try {
        if (currentChainId !== selectedChain.id) {
          const success = await switchNetwork(selectedChain)
          if (!success) {
            console.warn('Network switch failed or rejected, stopping continuation')
            return
          }
        }
      } catch (error: any) {
        logger.error('Network switch checks error:', error)
        // If error is generic, we might stop, but rely on switchNetwork return value mostly
        if (!error.message?.includes('Unsupported chainId')) {
          return
        }
      }
    }

    setStep('username')
    setUsername('')
    setClaimStatus(null)
    setTransactionHash(null)
    setUsernameAvailable(null)
    setCheckError(null)
  }

  const handleCreateDID = async () => {
    logger.info('Create DID button clicked', {
      authenticated,
      hasUser: !!user,
      username: username.trim(),
      usernameAvailable,
      isCheckingUsername,
    })

    if (!authenticated || !user) {
      logger.warn('Cannot create DID: not authenticated or no user')
      setClaimStatus('error')
      return
    }

    if (!username.trim()) {
      logger.warn('Cannot create DID: no username provided')
      setClaimStatus('error')
      return
    }

    // Wait for ongoing check
    if (isCheckingUsername) {
      logger.info('Waiting for username check to complete...')
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    if (usernameAvailable !== true) {
      setClaimStatus('error')
      return
    }

    setIsClaiming(true)
    setClaimStatus(null)

    try {
      const address = walletAddress || wallets[0]?.address
      if (!address) throw new Error('No wallet address found')

      const wallet = wallets[0]
      if (!wallet) throw new Error('No wallet found')

      const provider = await wallet.getEthereumProvider()
      if (!provider) throw new Error('Failed to get Ethereum provider')

      // Check network again
      try {
        const currentChainId = await provider.request({ method: 'eth_chainId' })
        const currentChainIdNumber = Number.parseInt(currentChainId as string, 16)

        if (currentChainIdNumber !== selectedChain.id) {
          try {
            await switchNetwork(selectedChain)
            await new Promise((resolve) => setTimeout(resolve, 1000))
          } catch (switchError) {
            console.warn('Network switch failed or not supported, proceeding...')
          }
        }
      } catch (error) {
        console.warn('Could not check current network, proceeding...')
      }

      const walletClient = createWalletClient({
        account: address as `0x${string}`,
        chain: selectedChain,
        transport: custom(provider),
      })

      const publicClient = createPublicClient({
        chain: selectedChain,
        transport: http(selectedChain.rpcUrls.default.http[0]),
      })

      const hash = await walletClient.writeContract({
        address: DID_REGISTRY_ADDRESS as `0x${string}`,
        abi: DID_REGISTRY_ABI,
        functionName: 'createDID',
        args: [address as `0x${string}`, username.trim()],
      })

      const receipt = await publicClient.waitForTransactionReceipt({ hash })

      setTransactionHash(hash)
      setClaimStatus('success')

      // Update DB
      try {
        const { did, username: fetchedUsername } = await fetchDIDForAddress(address, selectedChain)

        if (did) {
          await fetch('/api/users/me/profile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userDID: did,
              name: fetchedUsername || username.trim() || undefined,
            }),
          })

          // Move to success step instead of calling onSuccess immediately
          setStep('success')
        }
      } catch (error) {
        logger.error('Error updating DB after DID creation:', error)
      }
    } catch (error: any) {
      logger.error('Create DID error:', error)
      setClaimStatus('error')
    } finally {
      setIsClaiming(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedAddress(true)
      setTimeout(() => setCopiedAddress(false), 2000)
    } catch (error) {
      logger.error('Failed to copy:', error)
    }
  }

  return (
    <div className='flex flex-col h-screen'>
      <div className='flex-1 overflow-y-auto p-6'>
        <div className='space-y-6'>
          {step !== 'success' && (
            <div className='flex flex-col items-center space-y-4 text-center'>
              <div className='h-16 w-16'>
                <svg
                  width='100%'
                  height='100%'
                  viewBox='0 0 96 96'
                  fill='none'
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-full w-full drop-shadow-lg'
                >
                  <path
                    d='M22.8814 14.7044L48.1429 0L73.4043 14.7044L64.117 20.1366L48.1429 10.8644L32.1687 20.1366L22.8814 14.7044ZM73.4043 33.2488L64.117 27.8166L48.1429 37.0888L32.1687 27.8166L22.8814 33.2488V44.1132L38.8555 53.3854V71.9297L48.1429 77.362L57.4302 71.9297V53.3854L73.4043 44.1132V33.2488ZM73.4043 62.6576V51.7932L64.117 57.2254V68.0898L73.4043 62.6576ZM79.9984 66.4976L64.0243 75.7698V86.6341L89.2857 71.9297V42.521L79.9984 47.9532V66.4976ZM70.7111 23.9766L79.9984 29.4088V40.2732L89.2857 34.841V23.9766L79.9984 18.5444L70.7111 23.9766ZM38.8555 79.7034V90.5678L48.1429 96L57.4302 90.5678V79.7034L48.1429 85.1356L38.8555 79.7034ZM22.8814 62.6576L32.1687 68.0898V57.2254L22.8814 51.7932V62.6576ZM38.8555 23.9766L48.1429 29.4088L57.4302 23.9766L48.1429 18.5444L38.8555 23.9766ZM16.2873 29.4088L25.5746 23.9766L16.2873 18.5444L7 23.9766V34.841L16.2873 40.2732V29.4088ZM16.2873 47.9532L7 42.521V71.9297L32.2615 86.6341V75.7698L16.2873 66.4976V47.9532Z'
                    fill='#F0B90B'
                  />
                </svg>
              </div>
              <div className='space-y-2'>
                <h2 className={`${soehne.className} text-xl font-medium text-foreground`}>
                  {step === 'username' ? 'Claim Username' : 'Setup Deployment Identity'}
                </h2>
                <p className={`${inter.className} text-sm text-muted-foreground`}>
                  {step === 'username'
                    ? 'Choose a unique username for your agent'
                    : 'You need a DID (Decentralized Identifier) to deploy agents.'}
                </p>
              </div>
            </div>
          )}

          <AnimatePresence mode='wait'>
            {step === 'initial' ? (
              <motion.div
                key='initial'
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className='space-y-6'
              >
                {/* Network Selection */}
                <div className='space-y-3'>
                  <Label className='text-muted-foreground font-medium text-sm'>
                    Select Network
                  </Label>
                  <div className='grid grid-cols-2 gap-3'>
                    <button
                      onClick={() => {
                        setSelectedChain(BSC_TESTNET)
                        setCheckError(null)
                      }}
                      disabled={isSwitchingNetwork}
                      className={cn(
                        'flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 relative overflow-hidden group',
                        selectedChain.id === BSC_TESTNET.id
                          ? 'border-white bg-accent/50 shadow-md'
                          : 'border-white/10 bg-white/5 hover:border-white hover:bg-accent/50'
                      )}
                    >
                      <div className='absolute top-3 right-3'>
                        <div className={cn(
                          'h-4 w-4 rounded-full border flex items-center justify-center transition-all duration-200',
                          selectedChain.id === BSC_TESTNET.id
                            ? 'border-white bg-white'
                            : 'border-muted-foreground/50'
                        )}>
                          {selectedChain.id === BSC_TESTNET.id && (
                            <div className='h-1.5 w-1.5 rounded-full bg-black' />
                          )}
                        </div>
                      </div>

                      <div className='mb-2 rounded-full bg-background p-2 shadow-sm dark:bg-muted/50'>
                        <div className='h-6 w-6 flex items-center justify-center'>
                          <svg
                            width='100%'
                            height='100%'
                            viewBox='0 0 96 96'
                            fill='none'
                            xmlns='http://www.w3.org/2000/svg'
                            className='h-full w-full drop-shadow-lg'
                          >
                            <path
                              d='M22.8814 14.7044L48.1429 0L73.4043 14.7044L64.117 20.1366L48.1429 10.8644L32.1687 20.1366L22.8814 14.7044ZM73.4043 33.2488L64.117 27.8166L48.1429 37.0888L32.1687 27.8166L22.8814 33.2488V44.1132L38.8555 53.3854V71.9297L48.1429 77.362L57.4302 71.9297V53.3854L73.4043 44.1132V33.2488ZM73.4043 62.6576V51.7932L64.117 57.2254V68.0898L73.4043 62.6576ZM79.9984 66.4976L64.0243 75.7698V86.6341L89.2857 71.9297V42.521L79.9984 47.9532V66.4976ZM70.7111 23.9766L79.9984 29.4088V40.2732L89.2857 34.841V23.9766L79.9984 18.5444L70.7111 23.9766ZM38.8555 79.7034V90.5678L48.1429 96L57.4302 90.5678V79.7034L48.1429 85.1356L38.8555 79.7034ZM22.8814 62.6576L32.1687 68.0898V57.2254L22.8814 51.7932V62.6576ZM38.8555 23.9766L48.1429 29.4088L57.4302 23.9766L48.1429 18.5444L38.8555 23.9766ZM16.2873 29.4088L25.5746 23.9766L16.2873 18.5444L7 23.9766V34.841L16.2873 40.2732V29.4088ZM16.2873 47.9532L7 42.521V71.9297L32.2615 86.6341V75.7698L16.2873 66.4976V47.9532Z'
                              fill='#F0B90B'
                            />
                          </svg>
                        </div>
                      </div>
                      <span
                        className={cn(
                          'font-medium text-sm transition-colors duration-200'
                        )}
                      >
                        BSC Testnet
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedChain(BSC_MAINNET)
                        setCheckError(null)
                      }}
                      disabled={isSwitchingNetwork}
                      className={cn(
                        'flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 relative overflow-hidden group',
                        selectedChain.id === BSC_MAINNET.id
                          ? 'border-white bg-accent/50 shadow-md'
                          : 'border-white/10 bg-white/5 hover:border-white hover:bg-accent/50'
                      )}
                    >
                      <div className='absolute top-3 right-3'>
                        <div className={cn(
                          'h-4 w-4 rounded-full border flex items-center justify-center transition-all duration-200',
                          selectedChain.id === BSC_MAINNET.id
                            ? 'border-white bg-white'
                            : 'border-muted-foreground/50'
                        )}>
                          {selectedChain.id === BSC_MAINNET.id && (
                            <div className='h-1.5 w-1.5 rounded-full bg-black' />
                          )}
                        </div>
                      </div>

                      <div className='mb-2 rounded-full bg-background p-2 shadow-sm dark:bg-muted/50'>
                        <div className='h-6 w-6 flex items-center justify-center'>
                          <svg
                            width='100%'
                            height='100%'
                            viewBox='0 0 96 96'
                            fill='none'
                            xmlns='http://www.w3.org/2000/svg'
                            className='h-full w-full drop-shadow-lg'
                          >
                            <path
                              d='M22.8814 14.7044L48.1429 0L73.4043 14.7044L64.117 20.1366L48.1429 10.8644L32.1687 20.1366L22.8814 14.7044ZM73.4043 33.2488L64.117 27.8166L48.1429 37.0888L32.1687 27.8166L22.8814 33.2488V44.1132L38.8555 53.3854V71.9297L48.1429 77.362L57.4302 71.9297V53.3854L73.4043 44.1132V33.2488ZM73.4043 62.6576V51.7932L64.117 57.2254V68.0898L73.4043 62.6576ZM79.9984 66.4976L64.0243 75.7698V86.6341L89.2857 71.9297V42.521L79.9984 47.9532V66.4976ZM70.7111 23.9766L79.9984 29.4088V40.2732L89.2857 34.841V23.9766L79.9984 18.5444L70.7111 23.9766ZM38.8555 79.7034V90.5678L48.1429 96L57.4302 90.5678V79.7034L48.1429 85.1356L38.8555 79.7034ZM22.8814 62.6576L32.1687 68.0898V57.2254L22.8814 51.7932V62.6576ZM38.8555 23.9766L48.1429 29.4088L57.4302 23.9766L48.1429 18.5444L38.8555 23.9766ZM16.2873 29.4088L25.5746 23.9766L16.2873 18.5444L7 23.9766V34.841L16.2873 40.2732V29.4088ZM16.2873 47.9532L7 42.521V71.9297L32.2615 86.6341V75.7698L16.2873 66.4976V47.9532Z'
                              fill='#F0B90B'
                            />
                          </svg>
                        </div>
                      </div>
                      <span
                        className={cn(
                          'font-medium text-sm transition-colors duration-200'
                        )}
                      >
                        BSC Mainnet
                      </span>
                    </button>
                  </div>
                </div>

                <Button
                  onClick={hasWallets ? handleCreateDIDClick : connectWallet}
                  disabled={!ready}
                  className={cn(
                    'w-full gap-2 font-medium h-11',
                    'bg-[var(--brand-primary-hover-hex)] hover:bg-[var(--brand-primary-hover-hex)]',
                    'shadow-[0_0_0_0_var(--brand-primary-hover-hex)] hover:shadow-[0_0_0_4px_rgba(127,47,255,0.15)]',
                    'text-white transition-all duration-200',
                    'disabled:opacity-50 disabled:hover:bg-[var(--brand-primary-hover-hex)] disabled:hover:shadow-none'
                  )}
                >
                  {hasWallets ? 'Continue' : 'Connect Wallet'}
                </Button>
              </motion.div>
            ) : step === 'username' ? (
              <motion.div
                key='username'
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className='space-y-6'
              >
                <div className='space-y-2'>
                  <Label className='text-muted-foreground font-medium text-sm'>Username</Label>
                  <div className='relative'>
                    <Input
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                        setClaimStatus(null)
                        setCheckError(null)
                      }}
                      placeholder='Enter username'
                      className={cn(
                        'bg-muted/30 border-border text-foreground pr-10 h-11 transition-all duration-200',
                        usernameAvailable === true &&
                        'border-green-500 focus-visible:ring-green-500/20 focus-visible:border-green-500',
                        usernameAvailable === false &&
                        'border-destructive focus-visible:ring-destructive/20 focus-visible:border-destructive'
                      )}
                    />
                    <div className='absolute right-3 top-1/2 -translate-y-1/2'>
                      {isCheckingUsername ? (
                        <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
                      ) : usernameAvailable === true ? (
                        <Check className='h-4 w-4 text-green-500' />
                      ) : null}
                    </div>
                  </div>
                  <div className='h-5'>
                    {usernameAvailable === true && (
                      <p className='text-xs text-green-500 font-medium flex items-center gap-1'>
                        <Check className='h-3 w-3' /> Username available
                      </p>
                    )}
                    {usernameAvailable === false && (
                      <p className='text-xs text-destructive font-medium'>
                        Username is already taken
                      </p>
                    )}
                    {checkError && (
                      <p className='text-xs text-destructive font-medium'>
                        {checkError}
                      </p>
                    )}
                  </div>
                </div>

                <div className='flex gap-3'>
                  <Button
                    variant='outline'
                    onClick={() => setStep('initial')}
                    className='flex-1 text-muted-foreground hover:text-foreground h-11'
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleCreateDID}
                    disabled={isClaiming || !username || usernameAvailable !== true}
                    className={cn(
                      'flex-1 gap-2 font-medium h-11',
                      'bg-[var(--brand-primary-hover-hex)] hover:bg-[var(--brand-primary-hover-hex)]',
                      'shadow-[0_0_0_0_var(--brand-primary-hover-hex)] hover:shadow-[0_0_0_4px_rgba(127,47,255,0.15)]',
                      'text-white transition-all duration-200',
                      'disabled:opacity-50 disabled:hover:bg-[var(--brand-primary-hover-hex)] disabled:hover:shadow-none'
                    )}
                  >
                    {isClaiming ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Creating...
                      </>
                    ) : (
                      'Create DID'
                    )}
                  </Button>
                </div>

                {claimStatus === 'error' && (
                  <p className='text-sm text-destructive text-center bg-destructive/10 p-2 rounded-md'>
                    Failed to create DID. Please try again.
                  </p>
                )}
              </motion.div>
            ) : (
              <motion.div
                key='success'
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className='flex flex-col items-center justify-center space-y-6 py-8'
              >
                <div className='h-24 w-24 rounded-full bg-green-500/10 flex items-center justify-center'>
                  <Check className='h-12 w-12 text-green-500' />
                </div>
                <div className='text-center space-y-2'>
                  <h3 className='text-2xl font-semibold text-foreground'>DID Created!</h3>
                  <p className='text-muted-foreground max-w-[280px]'>
                    Your decentralized identity has been successfully created and linked to your
                    wallet.
                  </p>
                </div>
                <Button
                  onClick={onSuccess}
                  className={cn(
                    'w-full max-w-[200px] gap-2 font-medium h-11',
                    'bg-green-600 hover:bg-green-700',
                    'text-white transition-all duration-200'
                  )}
                >
                  Continue to Deploy
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div >
      </div >
    </div >
  )
}
