export interface PrivyLinkedAccount {
  type: string
  address?: string
  walletClientType?: string
  verifiedAt?: Date | null
  createdAt?: Date
  [key: string]: any
}

export interface PrivyUserData {
  privyId: string
  createdAt: Date
  updatedAt: Date
  linkedAccounts?: PrivyLinkedAccount[]
  wallet?: {
    address: string
    walletClientType?: string
    chainType?: string
    createdAt?: Date
    [key: string]: any
  }
  wallets?: Array<{
    address: string
    walletClientType?: string
    chainType?: string
    createdAt?: Date
    [key: string]: any
  }>
  metadata?: Record<string, any>
}
