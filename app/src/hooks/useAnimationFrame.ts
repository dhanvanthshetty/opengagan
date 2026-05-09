// useAnimationFrame.ts
import { useEffect, useRef } from 'react'

/**
 * Calls `callback` on every animation frame with the elapsed time in ms.
 * Changing the callback between renders does not restart the loop.
 */
export function useAnimationFrame(callback: (elapsedMs: number) => void): void {
  const cbRef = useRef(callback)
  cbRef.current = callback

  useEffect(() => {
    let rafId: number
    const loop = (t: number) => {
      cbRef.current(t)
      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [])
}
