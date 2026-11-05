import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/api'

/** const { data, error, loading, reload } = useFetch('/api/...')  — pass null to skip. */
export function useFetch(path) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(!!path)

  const load = useCallback(async () => {
    if (!path) return
    setLoading(true)
    try {
      setData(await api(path))
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [path])

  useEffect(() => {
    load()
  }, [load])

  return { data, error, loading, reload: load }
}
