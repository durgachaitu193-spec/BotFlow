import { createLogger } from '@wazabi/logger'
import { getBaseUrl } from '@/lib/core/utils/urls'
import { useEnvironmentStore } from '@/stores/settings/environment/store'
import type { ToolConfig } from '@/tools/types'

const logger = createLogger('CustomToolsUtils')

/**
 * Creates parameter schema from custom tool schema
 */
export function createParamSchema(customTool: any): Record<string, any> {
    const params: Record<string, any> = {}

    if (customTool.schema.function?.parameters?.properties) {
        const properties = customTool.schema.function.parameters.properties
        const required = customTool.schema.function.parameters.required || []

        Object.entries(properties).forEach(([key, config]: [string, any]) => {
            const isRequired = required.includes(key)

            // Create the base parameter configuration
            const paramConfig: Record<string, any> = {
                type: config.type || 'string',
                required: isRequired,
                description: config.description || '',
            }

            // Set visibility based on whether it's required
            if (isRequired) {
                paramConfig.visibility = 'user-or-llm'
            } else {
                paramConfig.visibility = 'user-only'
            }

            params[key] = paramConfig
        })
    }

    return params
}

/**
 * Get environment variables from store (client-side only)
 * @param getStore Optional function to get the store (useful for testing)
 */
export function getClientEnvVars(getStore?: () => any): Record<string, string> {
    if (typeof window === 'undefined') return {}

    try {
        // Allow injecting the store for testing
        const envStore = getStore ? getStore() : useEnvironmentStore.getState()
        const allEnvVars = envStore.getAllVariables()

        // Convert environment variables to a simple key-value object
        return Object.entries(allEnvVars).reduce(
            (acc, [key, variable]: [string, any]) => {
                acc[key] = variable.value
                return acc
            },
            {} as Record<string, string>
        )
    } catch (_error) {
        // In case of any errors (like in testing), return empty object
        return {}
    }
}

/**
 * Creates the request body configuration for custom tools
 * @param customTool The custom tool configuration
 * @param isClient Whether running on client side
 * @param workflowId Optional workflow ID for server-side
 * @param getStore Optional function to get the store (useful for testing)
 */
export function createCustomToolRequestBody(
    customTool: any,
    isClient = true,
    workflowId?: string,
    getStore?: () => any
) {
    return (params: Record<string, any>) => {
        // Get environment variables - try multiple sources in order of preference:
        // 1. envVars parameter (passed from provider/agent context)
        // 2. Client-side store (if running in browser)
        // 3. Empty object (fallback)
        const envVars = params.envVars || (isClient ? getClientEnvVars(getStore) : {})

        // Get workflow variables from params (passed from execution context)
        const workflowVariables = params.workflowVariables || {}

        // Get block data and mapping from params (passed from execution context)
        const blockData = params.blockData || {}
        const blockNameMapping = params.blockNameMapping || {}

        // Include everything needed for execution
        return {
            code: customTool.code,
            params: params, // These will be available in the VM context
            schema: customTool.schema.function.parameters, // For validation
            envVars: envVars, // Environment variables
            workflowVariables: workflowVariables, // Workflow variables for <variable.name> resolution
            blockData: blockData, // Runtime block outputs for <block.field> resolution
            blockNameMapping: blockNameMapping, // Block name to ID mapping
            workflowId: workflowId, // Pass workflowId for server-side context
            isCustomTool: true, // Flag to indicate this is a custom tool execution
        }
    }
}

// Helper function to create a tool config from a custom tool
function createToolConfig(customTool: any, customToolId: string): ToolConfig {
    // Create a parameter schema from the custom tool schema
    const params = createParamSchema(customTool)

    // Create a tool config for the custom tool
    return {
        id: customToolId,
        name: customTool.title,
        description: customTool.schema.function?.description || '',
        version: '1.0.0',
        params,

        // Request configuration - for custom tools we'll use the execute endpoint
        request: {
            url: '/api/function/execute',
            method: 'POST',
            headers: () => ({ 'Content-Type': 'application/json' }),
            body: createCustomToolRequestBody(customTool, true),
        },

        // Standard response handling for custom tools
        transformResponse: async (response: Response) => {
            const data = await response.json()

            if (!data.success) {
                throw new Error(data.error || 'Custom tool execution failed')
            }

            return {
                success: true,
                output: data.output.result || data.output,
                error: undefined,
            }
        },
    }
}

/**
 * Gets a custom tool definition by ID
 */
export async function getCustomTool(
    customToolId: string,
    workflowId?: string
): Promise<ToolConfig | undefined> {
    const identifier = customToolId.replace('custom_', '')

    try {
        const baseUrl = getBaseUrl()
        const url = new URL('/api/tools/custom', baseUrl)

        // Add workflowId as a query parameter if available
        if (workflowId) {
            url.searchParams.append('workflowId', workflowId)
        }

        // For server-side calls (during workflow execution), use internal JWT token
        const headers: Record<string, string> = {}
        if (typeof window === 'undefined') {
            try {
                const { generateInternalToken } = await import('@/lib/auth/internal')
                const internalToken = await generateInternalToken()
                headers.Authorization = `Bearer ${internalToken}`
            } catch (error) {
                logger.warn('Failed to generate internal token for custom tools fetch', { error })
                // Continue without token - will fail auth and be reported upstream
            }
        }

        const response = await fetch(url.toString(), {
            headers,
        })

        if (!response.ok) {
            logger.error(`Failed to fetch custom tools: ${response.statusText}`)
            return undefined
        }

        const result = await response.json()

        if (!result.data || !Array.isArray(result.data)) {
            logger.error(`Invalid response when fetching custom tools: ${JSON.stringify(result)}`)
            return undefined
        }

        // Try to find the tool by ID or title
        const customTool = result.data.find(
            (tool: any) => tool.id === identifier || tool.title === identifier
        )

        if (!customTool) {
            logger.error(`Custom tool not found: ${identifier}`)
            return undefined
        }

        // Create a parameter schema
        const params = createParamSchema(customTool)

        // Create a tool config for the custom tool
        return {
            id: customToolId,
            name: customTool.title,
            description: customTool.schema.function?.description || '',
            version: '1.0.0',
            params,

            // Request configuration - for custom tools we'll use the execute endpoint
            request: {
                url: '/api/function/execute',
                method: 'POST',
                headers: () => ({ 'Content-Type': 'application/json' }),
                body: createCustomToolRequestBody(customTool, false, workflowId),
            },

            // Same response handling as client-side
            transformResponse: async (response: Response) => {
                const data = await response.json()

                if (!data.success) {
                    throw new Error(data.error || 'Custom tool execution failed')
                }

                return {
                    success: true,
                    output: data.output.result || data.output,
                    error: undefined,
                }
            },
        }
    } catch (error) {
        logger.error(`Error fetching custom tool ${identifier} from API:`, error)
        return undefined
    }
}
