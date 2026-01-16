import { useCallback } from 'react'
import { useReactFlow } from 'reactflow'

/**
 * Hook to focus the workflow canvas on a specific block.
 * Uses React Flow's setCenter to smoothly animate to the block's position.
 */
export function useFocusOnBlock() {
    const { setCenter, getNode } = useReactFlow()

    const focusOnBlock = useCallback(
        (blockId: string) => {
            const node = getNode(blockId)
            if (node) {
                // Calculate center position of the node
                // We add half width and height to center on the middle of the node
                const x = node.position.x + (node.width ?? 0) / 2
                const y = node.position.y + (node.height ?? 0) / 2
                const zoom = 1.0

                setCenter(x, y, { zoom, duration: 800 })
            }
        },
        [getNode, setCenter]
    )

    return focusOnBlock
}
