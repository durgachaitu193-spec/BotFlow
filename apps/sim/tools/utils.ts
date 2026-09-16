import { createLogger } from '@botflow/logger'
import { getBaseUrl } from '@/lib/core/utils/urls'
import { useCustomToolsStore } from '@/stores/custom-tools/store'
import { useEnvironmentStore } from '@/stores/settings/environment/store'
import metadata from '@/tools/metadata.json'
import { tools as lazyTools } from '@/tools/registry'
import type { TableRow, ToolConfig, ToolResponse } from '@/tools/types'

export type ToolConfigMetadata = Pick<
  ToolConfig,
  'id' | 'name' | 'description' | 'version' | 'params' | 'outputs' | 'oauth'
>

const logger = createLogger('ToolsUtils')

/**
 * Transforms a table from the store format to a key-value object
 * @param table Array of table rows from the store
 * @returns Record of key-value pairs
 */
export const transformTable = (table: TableRow[] | null): Record<string, any> => {
  if (!table) return {}

  return table.reduce(
    (acc, row) => {
      if (row.cells?.Key && row.cells?.Value !== undefined) {
        // Extract the Value cell as is - it should already be properly resolved
        // by the InputResolver based on variable type (number, string, boolean etc.)
        const value = row.cells.Value

        // Store the correctly typed value in the result object
        acc[row.cells.Key] = value
      }
      return acc
    },
    {} as Record<string, any>
  )
}

interface RequestParams {
  url: string
  method: string
  headers: Record<string, string>
  body?: string
}

/**
 * Format request parameters based on tool configuration and provided params
 */
export function formatRequestParams(tool: ToolConfig, params: Record<string, any>): RequestParams {
  // Process URL
  const url = typeof tool.request.url === 'function' ? tool.request.url(params) : tool.request.url

  // Process method
  const method =
    typeof tool.request.method === 'function'
      ? tool.request.method(params)
      : params.method || tool.request.method || 'GET'

  // Process headers
  const headers = tool.request.headers ? tool.request.headers(params) : {}

  // Process body
  const hasBody = method !== 'GET' && method !== 'HEAD' && !!tool.request.body
  const bodyResult = tool.request.body ? tool.request.body(params) : undefined

  // Special handling for NDJSON content type or 'application/x-www-form-urlencoded'
  const isPreformattedContent =
    headers['Content-Type'] === 'application/x-ndjson' ||
    headers['Content-Type'] === 'application/x-www-form-urlencoded'

  let body: string | undefined
  if (hasBody) {
    if (isPreformattedContent) {
      // Check if bodyResult is a string
      if (typeof bodyResult === 'string') {
        body = bodyResult
      }
      // Check if bodyResult is an object with a 'body' property (Twilio pattern)
      else if (bodyResult && typeof bodyResult === 'object' && 'body' in bodyResult) {
        body = bodyResult.body
      }
      // Otherwise JSON stringify it
      else {
        body = JSON.stringify(bodyResult)
      }
    } else {
      body = typeof bodyResult === 'string' ? bodyResult : JSON.stringify(bodyResult)
    }
  }

  return { url, method, headers, body }
}

/**
 * Execute the actual request and transform the response
 */
export async function executeRequest(
  toolId: string,
  tool: ToolConfig,
  requestParams: RequestParams
): Promise<ToolResponse> {
  try {
    const { url, method, headers, body } = requestParams

    const externalResponse = await fetch(url, { method, headers, body })

    if (!externalResponse.ok) {
      let errorContent
      try {
        errorContent = await externalResponse.json()
      } catch (_e) {
        errorContent = { message: externalResponse.statusText }
      }

      const error = errorContent.message || `${toolId} API error: ${externalResponse.statusText}`
      logger.error(`${toolId} error:`, { error })
      throw new Error(error)
    }

    const transformResponse =
      tool.transformResponse ||
      (async (resp: Response) => ({
        success: true,
        output: await resp.json(),
      }))

    return await transformResponse(externalResponse)
  } catch (error: any) {
    return {
      success: false,
      output: {},
      error: error.message || 'Unknown error',
    }
  }
}

/**
 * Formats a parameter name for user-friendly error messages
 * Converts parameter names and descriptions to more readable format
 */
function formatParameterNameForError(paramName: string): string {
  // Split camelCase and snake_case/kebab-case into words, then capitalize first letter of each word
  return paramName
    .split(/(?=[A-Z])|[_-]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Validates required parameters after LLM and user params have been merged
 * This is the final validation before tool execution - ensures all required
 * user-or-llm parameters are present after the merge process
 */
export function validateRequiredParametersAfterMerge(
  toolId: string,
  tool: ToolConfig | undefined,
  params: Record<string, any>,
  parameterNameMap?: Record<string, string>
): void {
  if (!tool) {
    throw new Error(`Tool not found: ${toolId}`)
  }

  // Validate all required user-or-llm parameters after merge
  // user-only parameters should have been validated earlier during serialization
  for (const [paramName, paramConfig] of Object.entries(tool.params)) {
    if (
      (paramConfig as any).visibility === 'user-or-llm' &&
      paramConfig.required &&
      (!(paramName in params) ||
        params[paramName] === null ||
        params[paramName] === undefined ||
        params[paramName] === '')
    ) {
      // Create a more user-friendly error message
      const toolName = tool.name || toolId
      const friendlyParamName =
        parameterNameMap?.[paramName] || formatParameterNameForError(paramName)
      throw new Error(`${friendlyParamName} is required for ${toolName}`)
    }
  }
}

// Custom tool utilities have been moved to @/tools/custom
import {
  createCustomToolRequestBody,
  createParamSchema,
  getClientEnvVars,
  getCustomTool,
} from '@/tools/custom'
export { createCustomToolRequestBody, createParamSchema, getClientEnvVars, getCustomTool }

/**
 * Gets a tool definition by ID (Synchronous)
 * WARNING: This now only works for tools that were already loaded or are in metadata.
 * Built-in tools will return metadata-only versions if not already loaded.
 */
export function getTool(toolId: string): ToolConfig | undefined {
  // 1. Check metadata first (safe and fast)
  const meta = getToolMetadata(toolId)
  if (meta) {
    return meta as any
  }

  // 2. Fallback to registry if already loaded (unlikely now)
  // Since we removed the static import, we can't easily access the full config synchronously.
  // We return undefined or metadata.
  return undefined
}

// Get tool metadata by its ID (from metadata.json)
export function getToolMetadata(toolId: string): ToolConfigMetadata | undefined {
  // Try to find in metadata.json first
  const meta = (metadata as Record<string, any>)[toolId]
  if (meta) return meta as ToolConfigMetadata

  // Fallback to registry if not in metadata (e.g. for very new tools)
  // This part is now effectively removed as `tools` is no longer statically imported.
  // The new `getTool` and `getToolAsync` handle this differently.
  return undefined
}

/**
 * Gets a tool definition by ID (Asynchronous)
 * This is the preferred way to get a tool as it supports lazy loading.
 */
export async function getToolAsync(
  toolId: string,
  workflowId?: string
): Promise<ToolConfig | undefined> {
  // 1. Check custom tools
  if (toolId.startsWith('custom_')) {
    try {
      return await getCustomTool(toolId, workflowId)
    } catch (error) {
      logger.error('Failed to load custom tool', { toolId, error })
      return undefined
    }
  }

  // 2. Check lazy registry for built-in tools
  const loader = lazyTools[toolId]
  if (loader) {
    try {
      return await loader()
    } catch (error) {
      logger.error('Failed to lazy load tool', { toolId, error })
      // Fallback to metadata if loading fails
    }
  }

  // 3. Fallback to metadata (useful for schema generation even if logic is missing)
  const meta = getToolMetadata(toolId)
  if (meta) {
    return meta as any
  }

  return undefined
}

