import { useEffect, useState } from 'react'

// Tiny hash router: keeps the prototype dependency-free and lets it run from
// any static host (or straight from a file) without server rewrites.

function readLocation() {
  const raw = window.location.hash.replace(/^#/, '') || '/'
  const [path, query = ''] = raw.split('?')
  return { path: path || '/', params: new URLSearchParams(query) }
}

export function useRoute() {
  const [loc, setLoc] = useState(readLocation)
  useEffect(() => {
    const onChange = () => {
      setLoc(readLocation())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return loc
}

export function navigate(to) {
  window.location.hash = to
}

export function Link({ to, children, className, ...rest }) {
  return (
    <a href={`#${to}`} className={className} {...rest}>
      {children}
    </a>
  )
}
