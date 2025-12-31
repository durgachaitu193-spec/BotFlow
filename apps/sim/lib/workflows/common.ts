/**
 * Utility to strip the 'custom_' prefix from a tool name
 * @param name - The tool name to sanitize
 * @returns The sanitized tool name
 */
export function stripCustomToolPrefix(name: string) {
    return name.startsWith('custom_') ? name.replace('custom_', '') : name
}
