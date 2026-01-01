/**
 * Utility functions for comparing workflow states and data
 */

/**
 * Normalize a value for consistent comparison by sorting object keys
 * @param value - The value to normalize
 * @returns A normalized version of the value
 */
export function normalizeValue(value: any): any {
    // If not an object or array, return as is
    if (value === null || value === undefined || typeof value !== 'object') {
        return value
    }

    // Handle arrays by normalizing each element
    if (Array.isArray(value)) {
        return value.map(normalizeValue)
    }

    // For objects, sort keys and normalize each value
    const sortedObj: Record<string, any> = {}

    // Get all keys and sort them
    const sortedKeys = Object.keys(value).sort()

    // Reconstruct object with sorted keys and normalized values
    for (const key of sortedKeys) {
        sortedObj[key] = normalizeValue(value[key])
    }

    return sortedObj
}

/**
 * Generate a normalized JSON string for comparison
 * @param value - The value to normalize and stringify
 * @returns A normalized JSON string
 */
export function normalizedStringify(value: any): string {
    return JSON.stringify(normalizeValue(value))
}

/**
 * Normalize an edge by keeping only functional properties
 */
export function normalizeEdge(edge: any) {
    return {
        source: edge.source,
        sourceHandle: edge.sourceHandle,
        target: edge.target,
        targetHandle: edge.targetHandle,
    }
}

/**
 * Sort edges consistently for comparison
 */
export function sortEdges(edges: any[]) {
    return [...edges].sort((a, b) => {
        const keyA = `${a.source}-${a.sourceHandle}-${a.target}-${a.targetHandle}`
        const keyB = `${b.source}-${b.sourceHandle}-${b.target}-${b.targetHandle}`
        return keyA.localeCompare(keyB)
    })
}
