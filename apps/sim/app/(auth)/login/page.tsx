import PrivyLogin from '@/app/(auth)/login/privy-login'

// Force dynamic rendering to avoid prerender errors with search params
export const dynamic = 'force-dynamic'

export default async function LoginPage() {
  return <PrivyLogin />
}
