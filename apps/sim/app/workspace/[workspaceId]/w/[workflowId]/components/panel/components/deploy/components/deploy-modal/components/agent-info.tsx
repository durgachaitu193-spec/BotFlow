'use client'

import { useState } from 'react'
import { Check, Copy, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { AgentMetadata } from '@/lib/contracts/agentMetadata'
import { createLogger } from '@/lib/logs/console/logger'

const logger = createLogger('AgentInfo')

interface AgentInfoProps {
    agentId: string
    agentDID?: string
    transactionHash: string
    metadata?: AgentMetadata
}

export function AgentInfo({ agentId, agentDID, transactionHash, metadata }: AgentInfoProps) {
    const [copiedItem, setCopiedItem] = useState<string | null>(null)

    const handleCopy = async (text: string, itemName: string) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopiedItem(itemName)
            setTimeout(() => setCopiedItem(null), 2000)
        } catch (error) {
            console.error(`Error copying ${itemName}:`, error)
        }
    }

    // Truncate middle of long strings for display
    const truncateMiddle = (str: string, maxLength = 20) => {
        if (str.length <= maxLength) return str
        const start = Math.ceil(maxLength / 2)
        const end = Math.floor(maxLength / 2)
        return `${str.slice(0, start)}...${str.slice(-end)}`
    }

    return (
        <div className='space-y-3'>
            <div className='flex items-center justify-between'>
                <Label className='font-medium text-sm'>Agent Registration</Label>
            </div>
            <div className='rounded-md border bg-muted/30 p-4 space-y-3'>
                {/* Agent ID */}
                <div className='flex items-center justify-between gap-2'>
                    <span className='text-muted-foreground text-xs flex-shrink-0'>Agent ID:</span>
                    <div className='flex items-center gap-1 min-w-0'>
                        <span className='font-mono text-xs truncate' title={agentId}>
                            {agentId}
                        </span>
                        <Button
                            variant='ghost'
                            size='icon'
                            className='h-6 w-6 flex-shrink-0 text-muted-foreground hover:text-foreground'
                            onClick={() => handleCopy(agentId, 'agentId')}
                            aria-label='Copy Agent ID'
                        >
                            {copiedItem === 'agentId' ? (
                                <Check className='h-3 w-3 text-green-500' />
                            ) : (
                                <Copy className='h-3 w-3' />
                            )}
                        </Button>
                    </div>
                </div>

                {/* Agent DID */}
                {agentDID && (
                    <div className='flex items-center justify-between gap-2'>
                        <span className='text-muted-foreground text-xs flex-shrink-0'>Agent DID:</span>
                        <div className='flex items-center gap-1 min-w-0'>
                            <span className='font-mono text-xs truncate' title={agentDID}>
                                {truncateMiddle(agentDID, 32)}
                            </span>
                            <Button
                                variant='ghost'
                                size='icon'
                                className='h-6 w-6 flex-shrink-0 text-muted-foreground hover:text-foreground'
                                onClick={() => handleCopy(agentDID, 'agentDID')}
                                aria-label='Copy Agent DID'
                            >
                                {copiedItem === 'agentDID' ? (
                                    <Check className='h-3 w-3 text-green-500' />
                                ) : (
                                    <Copy className='h-3 w-3' />
                                )}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Transaction Hash */}
                <div className='flex items-center justify-between gap-2'>
                    <span className='text-muted-foreground text-xs flex-shrink-0'>Transaction Hash:</span>
                    <div className='flex items-center gap-1 min-w-0'>
                        <a
                            href={`https://testnet.bscscan.com/tx/${transactionHash}`}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='font-mono text-xs text-blue-600 hover:underline dark:text-blue-400 truncate'
                            title={transactionHash}
                        >
                            {truncateMiddle(transactionHash, 16)}
                        </a>
                        <Button
                            variant='ghost'
                            size='icon'
                            className='h-6 w-6 flex-shrink-0 text-muted-foreground hover:text-foreground'
                            onClick={() => handleCopy(transactionHash, 'txHash')}
                            aria-label='Copy Transaction Hash'
                        >
                            {copiedItem === 'txHash' ? (
                                <Check className='h-3 w-3 text-green-500' />
                            ) : (
                                <Copy className='h-3 w-3' />
                            )}
                        </Button>
                        <Button
                            variant='ghost'
                            size='icon'
                            className='h-6 w-6 flex-shrink-0 text-muted-foreground hover:text-foreground'
                            onClick={() =>
                                window.open(`https://testnet.bscscan.com/tx/${transactionHash}`, '_blank')
                            }
                            aria-label='View on BSCScan'
                        >
                            <ExternalLink className='h-3 w-3' />
                        </Button>
                    </div>
                </div>

                {/* Metadata Fields */}
                {metadata && (
                    <div className='pt-3 border-t space-y-3'>
                        <Label className='font-medium text-xs'>Metadata</Label>

                        {/* Workflow */}
                        {metadata.workflowName && (
                            <div className='flex items-center justify-between'>
                                <span className='text-muted-foreground text-xs'>Workflow:</span>
                                <span className='font-medium text-xs'>{metadata.workflowName}</span>
                            </div>
                        )}

                        {/* Deployed At */}
                        {metadata.deployedAt && (
                            <div className='flex items-center justify-between'>
                                <span className='text-muted-foreground text-xs'>Deployed At:</span>
                                <span className='font-medium text-xs'>
                                    {new Date(metadata.deployedAt).toLocaleString()}
                                </span>
                            </div>
                        )}

                        {/* API Endpoint */}
                        {metadata.apiEndpoint && (
                            <div className='flex items-center justify-between gap-2'>
                                <span className='text-muted-foreground text-xs flex-shrink-0'>API Endpoint:</span>
                                <div className='flex items-center gap-1 min-w-0'>
                                    <span className='font-mono text-xs truncate' title={metadata.apiEndpoint}>
                                        {metadata.apiEndpoint}
                                    </span>
                                    <Button
                                        variant='ghost'
                                        size='icon'
                                        className='h-6 w-6 flex-shrink-0 text-muted-foreground hover:text-foreground'
                                        onClick={() => handleCopy(metadata.apiEndpoint!, 'apiEndpoint')}
                                        aria-label='Copy API Endpoint'
                                    >
                                        {copiedItem === 'apiEndpoint' ? (
                                            <Check className='h-3 w-3 text-green-500' />
                                        ) : (
                                            <Copy className='h-3 w-3' />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Chat URL */}
                        {metadata.chatUrl && (
                            <div className='flex items-center justify-between gap-2'>
                                <span className='text-muted-foreground text-xs flex-shrink-0'>Chat URL:</span>
                                <div className='flex items-center gap-1 min-w-0'>
                                    <a
                                        href={metadata.chatUrl}
                                        target='_blank'
                                        rel='noopener noreferrer'
                                        className='text-xs text-blue-600 hover:underline dark:text-blue-400 truncate'
                                        title={metadata.chatUrl}
                                    >
                                        {metadata.chatUrl}
                                    </a>
                                    <Button
                                        variant='ghost'
                                        size='icon'
                                        className='h-6 w-6 flex-shrink-0 text-muted-foreground hover:text-foreground'
                                        onClick={() => window.open(metadata.chatUrl, '_blank')}
                                        aria-label='Open Chat URL'
                                    >
                                        <ExternalLink className='h-3 w-3' />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Chat Details */}
                        {metadata.chatIdentifier && (
                            <div className='flex items-center justify-between'>
                                <span className='text-muted-foreground text-xs'>Identifier:</span>
                                <span className='font-mono text-xs'>{metadata.chatIdentifier}</span>
                            </div>
                        )}

                        {metadata.chatTitle && (
                            <div className='flex items-center justify-between'>
                                <span className='text-muted-foreground text-xs'>Title:</span>
                                <span className='font-medium text-xs'>{metadata.chatTitle}</span>
                            </div>
                        )}

                        {metadata.chatDescription && (
                            <div className='space-y-1'>
                                <span className='text-muted-foreground text-xs'>Description:</span>
                                <Textarea
                                    value={metadata.chatDescription}
                                    readOnly
                                    className='resize-none text-xs h-16 bg-background'
                                />
                            </div>
                        )}

                        {metadata.chatAuthType && (
                            <div className='flex items-center justify-between'>
                                <span className='text-muted-foreground text-xs'>Auth Type:</span>
                                <span className='font-medium text-xs capitalize'>{metadata.chatAuthType}</span>
                            </div>
                        )}

                        {/* Token Details */}
                        {metadata.tokenName && (
                            <div className='flex items-center justify-between'>
                                <span className='text-muted-foreground text-xs'>Token Name:</span>
                                <span className='font-medium text-xs'>{metadata.tokenName}</span>
                            </div>
                        )}

                        {metadata.tokenSymbol && (
                            <div className='flex items-center justify-between'>
                                <span className='text-muted-foreground text-xs'>Token Symbol:</span>
                                <span className='font-mono text-xs'>{metadata.tokenSymbol}</span>
                            </div>
                        )}

                        {metadata.tokenAddress && (
                            <div className='flex items-center justify-between gap-2'>
                                <span className='text-muted-foreground text-xs flex-shrink-0'>
                                    Token Address:
                                </span>
                                <div className='flex items-center gap-1 min-w-0'>
                                    <a
                                        href={`https://testnet.bscscan.com/address/${metadata.tokenAddress}`}
                                        target='_blank'
                                        rel='noopener noreferrer'
                                        className='font-mono text-xs text-blue-600 hover:underline dark:text-blue-400 truncate'
                                        title={metadata.tokenAddress}
                                    >
                                        {truncateMiddle(metadata.tokenAddress, 16)}
                                    </a>
                                    <Button
                                        variant='ghost'
                                        size='icon'
                                        className='h-6 w-6 flex-shrink-0 text-muted-foreground hover:text-foreground'
                                        onClick={() => handleCopy(metadata.tokenAddress!, 'tokenAddress')}
                                        aria-label='Copy Token Address'
                                    >
                                        {copiedItem === 'tokenAddress' ? (
                                            <Check className='h-3 w-3 text-green-500' />
                                        ) : (
                                            <Copy className='h-3 w-3' />
                                        )}
                                    </Button>
                                    <Button
                                        variant='ghost'
                                        size='icon'
                                        className='h-6 w-6 flex-shrink-0 text-muted-foreground hover:text-foreground'
                                        onClick={() =>
                                            window.open(
                                                `https://testnet.bscscan.com/address/${metadata.tokenAddress}`,
                                                '_blank'
                                            )
                                        }
                                        aria-label='View Token on BSCScan'
                                    >
                                        <ExternalLink className='h-3 w-3' />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Token Image */}
                        {metadata.tokenImageIpfsHash && (
                            <div className='space-y-2'>
                                <span className='text-muted-foreground text-xs'>Token Image:</span>
                                <div className='flex items-start gap-3'>
                                    <div className='relative h-20 w-20 overflow-hidden rounded-lg border border-border bg-muted flex-shrink-0'>
                                        <img
                                            src={`https://gateway.pinata.cloud/ipfs/${metadata.tokenImageIpfsHash}`}
                                            alt={metadata.tokenName || 'Token'}
                                            className='h-full w-full object-cover'
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement
                                                target.style.display = 'none'
                                                const parent = target.parentElement
                                                if (parent) {
                                                    parent.innerHTML = '<div class="flex h-full w-full items-center justify-center text-muted-foreground text-xs">Failed to load</div>'
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className='flex flex-col gap-1 min-w-0 flex-1'>
                                        <div className='flex items-center gap-1'>
                                            <a
                                                href={`https://gateway.pinata.cloud/ipfs/${metadata.tokenImageIpfsHash}`}
                                                target='_blank'
                                                rel='noopener noreferrer'
                                                className='font-mono text-xs text-blue-600 hover:underline dark:text-blue-400 truncate'
                                                title={metadata.tokenImageIpfsHash}
                                            >
                                                {truncateMiddle(metadata.tokenImageIpfsHash, 20)}
                                            </a>
                                            <Button
                                                variant='ghost'
                                                size='icon'
                                                className='h-6 w-6 flex-shrink-0 text-muted-foreground hover:text-foreground'
                                                onClick={() => handleCopy(metadata.tokenImageIpfsHash!, 'tokenImageIpfsHash')}
                                                aria-label='Copy IPFS Hash'
                                            >
                                                {copiedItem === 'tokenImageIpfsHash' ? (
                                                    <Check className='h-3 w-3 text-green-500' />
                                                ) : (
                                                    <Copy className='h-3 w-3' />
                                                )}
                                            </Button>
                                            <Button
                                                variant='ghost'
                                                size='icon'
                                                className='h-6 w-6 flex-shrink-0 text-muted-foreground hover:text-foreground'
                                                onClick={() =>
                                                    window.open(
                                                        `https://gateway.pinata.cloud/ipfs/${metadata.tokenImageIpfsHash}`,
                                                        '_blank'
                                                    )
                                                }
                                                aria-label='View on IPFS'
                                            >
                                                <ExternalLink className='h-3 w-3' />
                                            </Button>
                                        </div>
                                        <span className='text-muted-foreground text-[10px]'>
                                            Stored on IPFS via Pinata
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
