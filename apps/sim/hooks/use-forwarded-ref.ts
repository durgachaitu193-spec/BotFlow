import { type ForwardedRef, useEffect, useRef } from 'react'

/**
 * A hook that combines a forwarded ref with a local ref.
 * This is useful when you need both a forwarded ref and a local ref to the same element.
 * 
 * @param forwardedRef - The ref forwarded from a parent component
 * @returns A local ref that syncs with the forwarded ref
 */
export function useForwardedRef<T>(forwardedRef: ForwardedRef<T>) {
    const innerRef = useRef<T>(null)

    useEffect(() => {
        if (!forwardedRef) return

        if (typeof forwardedRef === 'function') {
            forwardedRef(innerRef.current)
        } else {
            forwardedRef.current = innerRef.current
        }
    }, [forwardedRef])

    return innerRef
}
