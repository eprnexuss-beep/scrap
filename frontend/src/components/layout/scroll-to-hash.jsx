import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Makes links like /#how work from ANY page: after navigating, scroll to that section
 * (waiting briefly for the target page to render). Plain navigations start at the top.
 */
export function ScrollToHash() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      return
    }
    let tries = 0
    let timer
    const seek = () => {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)))
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      else if (tries++ < 30) timer = setTimeout(seek, 50)
    }
    seek()
    return () => clearTimeout(timer)
  }, [pathname, hash])

  return null
}
