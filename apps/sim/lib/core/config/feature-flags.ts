/**
 * Feature flags configuration
 * Re-exports environment-based feature flags for easier imports
 */
export {
    isHosted,
    isProd,
    isDev,
    isTest,
    isBillingEnabled,
    isEmailVerificationEnabled,
    isAuthDisabled,
    isRegistrationDisabled,
    isEmailPasswordEnabled,
    isTriggerDevEnabled,
    isSsoEnabled,
    isCredentialSetsEnabled,
    isAccessControlEnabled,
    isOrganizationsEnabled,
    isE2bEnabled,
    getCostMultiplier,
} from './environment'
