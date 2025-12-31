import { ethers } from 'ethers'
import { v4 as uuidv4 } from 'uuid'
import { bscTestnet } from 'viem/chains'
import Web3 from 'web3'
import { nextApiFetch } from '@/global/utils/nextApiFetch'
import {
  createToken as createTokenOnChain,
  TOKEN_FACTORY_ADDRESS,
} from '../../lib/contracts/tokenFactory'
import ERC20Token from '../abi/ERC20.json'

const generateShortId = (): string => {
  const uuid = uuidv4()
  return uuid.replace(/-/g, '').substring(0, 8)
}

declare global {
  interface Window {
    web3: Web3
  }
}

const isBrowser = () => typeof window !== 'undefined'
if (isBrowser() && window.ethereum) {
  window.web3 = new Web3(window.ethereum)
  window.web3 = new Web3(window.web3.currentProvider)
}

interface ICreateTokenProps {
  tokenName: string
  tokenSymbol: string
  tokenIpfsHash: string
  address: string
  network: string
  twitter?: string
  telegram?: string
  website?: string
  logo?: string
  description?: string
  setLoading?: (loading: boolean) => void
  afterSuccess?: (id: string) => void
}

export const createToken = async ({
  tokenName,
  tokenSymbol,
  tokenIpfsHash,
  address,
  network,
  twitter,
  telegram,
  website,
  logo,
  description,
  setLoading,
  afterSuccess,
}: ICreateTokenProps) => {
  try {
    const id = generateShortId()

    console.log('Step 1: Creating token record in database...', {
      id,
      tokenName,
      tokenSymbol,
    })

    // Step 1: Create token record in database
    const { data, error } = await nextApiFetch({
      url: 'api/v1/create',
      method: 'POST',
      data: {
        address,
        name: tokenName,
        symbol: tokenSymbol,
        description: description || '',
        logo: logo || '',
        ipfsHash: tokenIpfsHash,
        twitter: twitter || '',
        telegram: telegram || '',
        website: website || '',
        network,
        id,
      },
    })

    if (error) {
      setLoading?.(false)
      console.error('Error creating token record:', error)
      throw new Error(error)
    }

    console.log('✅ Token record created successfully')
    console.log('Step 2: Creating token on blockchain using tokenFactory helper...')

    // Check if wallet is connected
    if (!window.ethereum) {
      throw new Error('No Ethereum wallet found. Please install MetaMask.')
    }

    // Step 2: Use tokenFactory helper to create token on blockchain
    const result = await createTokenOnChain(
      address,
      tokenName,
      tokenSymbol,
      tokenIpfsHash,
      window.ethereum,
      bscTestnet
    )

    if (!result || !result.tokenAddress) {
      throw new Error('Failed to create token on blockchain')
    }

    const { tokenAddress, txHash } = result

    console.log('✅ Token created on blockchain', { tokenAddress, txHash })
    console.log('Step 3: Updating database with blockchain details...')

    // Step 3: Update database with blockchain details
    const updateResponse = await nextApiFetch({
      url: 'api/v1/create/token/evm',
      method: 'POST',
      data: {
        id,
        txHash,
        tokenAddress,
      },
    })

    if (updateResponse.error) {
      console.error('Error updating token record:', updateResponse.error)
      // Don't throw here - token is already created on blockchain
    } else {
      console.log('✅ Database updated successfully')
    }

    afterSuccess?.(id)
    setLoading?.(false)

    console.log('🎉 Token creation complete!', { id, txHash, tokenAddress })

    return { success: true, transactionHash: txHash, tokenAddress, id }
  } catch (error: any) {
    console.error('❌ Error creating token:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      data: error.data,
    })
    setLoading?.(false)
    throw error // Re-throw to show error to user
  }
}

export const buyToken = async ({
  id,
  amount,
  tokenName,
  tokenSymbol,
  cost,
  address,
  setLoading,
}: {
  id: string
  amount: number
  tokenName: string
  tokenSymbol: string
  cost: string
  address: string
  setLoading: (loading: boolean) => void
}) => {
  const provider = new ethers.providers.Web3Provider(window.ethereum)
  const signer = provider.getSigner()
  const contract = new ethers.Contract(TOKEN_FACTORY_ADDRESS, ERC20Token, signer)
  const tx = await contract.buytoken(tokenName, tokenSymbol, amount, {
    value: ethers.utils.parseEther(cost),
  })
  const receipt = await tx.wait()
  const txHash = receipt.transactionHash
  const blockHash = receipt?.blockHash
  const txIndex = receipt?.transactionIndex
  return new Promise((resolve, reject) => {
    const executeAsync = async () => {
      try {
        await nextApiFetch({
          url: 'api/v1/swap/buy/evm',
          method: 'POST',
          data: {
            blockHash,
            txIndex,
            address,
            txHash,
            id,
            amount: amount.toString(),
          },
        })
        setLoading(false)
        resolve(true)
      } catch (error: unknown) {
        reject(error)
        throw new Error(String(error))
      }
    }
    executeAsync()
  })
}

export const sellToken = async ({
  tokenName,
  tokenSymbol,
  id,
  amount,
  address,
  setLoading,
}: {
  tokenName: string
  tokenSymbol: string
  id: string
  amount: number
  address: string
  setLoading: (loading: boolean) => void
}) => {
  const provider = new ethers.providers.Web3Provider(window.ethereum)
  const signer = provider.getSigner()
  const contract = new ethers.Contract(TOKEN_FACTORY_ADDRESS, ERC20Token, signer)
  const tx = await contract.selltoken(tokenName, tokenSymbol, amount)
  const receipt = await tx.wait()
  const txHash = receipt.transactionHash
  const blockHash = receipt?.blockHash
  const txIndex = receipt?.transactionIndex

  return new Promise((resolve, reject) => {
    const executeAsync = async () => {
      try {
        await nextApiFetch({
          url: 'api/v1/swap/sell/evm',
          method: 'POST',
          data: {
            blockHash,
            txIndex,
            address,
            txHash,
            id,
            amount: amount.toString(),
          },
        })
        setLoading(false)
        resolve(true)
      } catch (error: unknown) {
        reject(error)
        throw new Error(String(error))
      }
    }
    executeAsync()
  })
}

export const calculateTotalCost = async ({
  tokenName,
  tokenSymbol,
  amount,
}: {
  tokenName: string
  tokenSymbol: string
  amount: number
}) => {
  const provider = new ethers.providers.Web3Provider(window.ethereum)
  const contract = new ethers.Contract(TOKEN_FACTORY_ADDRESS, ERC20Token, provider)

  const cost = await contract.calculateTotalCost(tokenName, tokenSymbol, amount)
  const formattedCost = ethers.utils.formatEther(cost)
  return formattedCost
}

export const getAllTokenInformation = async () => {
  const provider = new ethers.providers.Web3Provider(window.ethereum)
  const contract = new ethers.Contract(TOKEN_FACTORY_ADDRESS, ERC20Token, provider)

  const tokenInfo = await contract.getAllTokenInformation()
  return tokenInfo.map((info: { name: string; symbol: string; ipfsHash: string }) => ({
    name: info.name,
    symbol: info.symbol,
    ipfsHash: info.ipfsHash,
  }))
}
