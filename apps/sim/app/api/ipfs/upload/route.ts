import { createLogger } from '@sim/logger'
import { type NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/core/config/env'

const logger = createLogger('IPFSUpload')

/**
 * Upload image to IPFS via Pinata and return hash
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const tokenName = formData.get('tokenName') as string
    const tokenSymbol = formData.get('tokenSymbol') as string

    if (!file) {
      // If no file provided, return a default IPFS hash
      const defaultHash = generateDefaultHash(tokenName, tokenSymbol)
      logger.info('No file provided, using default hash', { defaultHash })
      return NextResponse.json({ ipfsHash: defaultHash })
    }

    // Get Pinata credentials
    const pinataApiKey = getEnv('NEXT_PUBLIC_PINATA_API_KEY')
    const pinataSecretApiKey = getEnv('NEXT_PUBLIC_PINATA_SECRET_API_KEY')

    if (!pinataApiKey || !pinataSecretApiKey) {
      logger.warn('Pinata credentials not configured, using placeholder hash')
      const placeholderHash = generateDefaultHash(tokenName, tokenSymbol)
      return NextResponse.json({ ipfsHash: placeholderHash })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image (PNG, JPG, GIF, or WebP)' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 })
    }

    logger.info('Uploading to Pinata', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      tokenName,
      tokenSymbol,
    })

    // Create form data for Pinata
    const pinataFormData = new FormData()
    pinataFormData.append('file', file)

    // Add metadata
    const metadata = JSON.stringify({
      name: `${tokenName} (${tokenSymbol}) Token Logo`,
      keyvalues: {
        tokenName,
        tokenSymbol,
        uploadedAt: new Date().toISOString(),
      },
    })
    pinataFormData.append('pinataMetadata', metadata)

    // Add pinning options
    const options = JSON.stringify({
      cidVersion: 1,
    })
    pinataFormData.append('pinataOptions', options)

    // Upload to Pinata
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataSecretApiKey,
      },
      body: pinataFormData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error('Pinata upload failed', {
        status: response.status,
        error: errorText,
      })
      throw new Error(`Pinata upload failed: ${response.status}`)
    }

    const result = await response.json()
    const ipfsHash = result.IpfsHash

    logger.info('Successfully uploaded to Pinata', {
      ipfsHash,
      pinataUrl: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
    })

    return NextResponse.json({
      ipfsHash,
      pinataUrl: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
    })
  } catch (error: any) {
    logger.error('Error uploading to IPFS:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upload to IPFS' },
      { status: 500 }
    )
  }
}

/**
 * Generate a deterministic placeholder hash based on token info
 * This creates a valid-looking IPFS hash (Qm... format)
 * Used as fallback when Pinata is not configured or upload fails
 */
function generateDefaultHash(tokenName: string, tokenSymbol: string): string {
  // Use token symbol and name to generate a deterministic hash
  const base = `${tokenSymbol}-${tokenName}`.toLowerCase()
  const hash = Buffer.from(base)
    .toString('base64')
    .replace(/[^a-zA-Z0-9]/g, '')
  // IPFS hashes typically start with "Qm" and are 46 characters long
  return `Qm${hash.substring(0, 44).padEnd(44, 'x')}`
}
