/**
 * Environment variable getter for launchpad
 */
export const getEnv = (variable: string): string | undefined => {
  return process.env[variable]
}

/**
 * Get required environment variable, throw if missing
 */
export const getRequiredEnv = (variable: string): string => {
  const value = process.env[variable]
  if (!value) {
    throw new Error(`Missing required environment variable: ${variable}`)
  }
  return value
}
