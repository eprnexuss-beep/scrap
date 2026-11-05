import { useRouter } from '@/lib/router'
import { ROUTES } from '@/lib/routes'

export function useAppNav() {
  const router = useRouter()
  return (view) => router.push(ROUTES[view])
}
