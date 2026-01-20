'use client'

// Re-export Privy hooks to ensure single module instance across monorepo
// This prevents context mismatch issues where provider and hooks are from different bundles
export {
    usePrivy,
    useWallets,
    useCreateWallet,
    useLogin,
    useLogout,
    useLinkAccount,
} from '@privy-io/react-auth'
