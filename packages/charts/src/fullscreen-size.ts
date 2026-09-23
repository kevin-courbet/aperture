import { useLayoutEffect, useRef, useState } from 'react'

interface FullscreenSize {
  readonly width: number
  readonly height: number
}

// Measure the flex-allocated plot box, not the SVG. The rendered chart must not
// determine its own measurement, or resizing can create a feedback loop.
export function useFullscreenSize() {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<FullscreenSize | null>(null)
  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const document = element.ownerDocument
    const view = document.defaultView
    function measure() {
      if (!document.fullscreenElement?.contains(element)) {
        setSize(current => current === null ? current : null)
        return
      }
      const rect = element!.getBoundingClientRect()
      const width = Math.floor(rect.width)
      const height = Math.floor(rect.height)
      if (width <= 0 || height <= 0) return
      setSize(current => current?.width === width && current.height === height
        ? current : { width, height })
    }
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    document.addEventListener('fullscreenchange', measure)
    view?.addEventListener('resize', measure)
    measure()
    return () => {
      observer.disconnect()
      document.removeEventListener('fullscreenchange', measure)
      view?.removeEventListener('resize', measure)
    }
  }, [])
  return { ref, size }
}
