import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

/** Small imperative navigation helper: router.push('/x'), router.replace('/x'), router.back(). */
export function useRouter() {
  const navigate = useNavigate()
  return useMemo(
    () => ({
      push: (to) => navigate(to),
      replace: (to) => navigate(to, { replace: true }),
      back: () => navigate(-1),
      refresh: () => {},
    }),
    [navigate],
  )
}
