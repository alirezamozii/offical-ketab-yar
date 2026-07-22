import { useSyncExternalStore } from "react"

/**
 * SSR-safe "are we mounted in the browser?" flag.
 *
 * Replaces the legacy `useState(false) + useEffect(() => setMounted(true), [])`
 * pattern — which fires the `react-hooks/set-state-in-effect` lint rule because
 * it synchronously calls setState during the effect body (causing an extra
 * render). `useSyncExternalStore` is the React-blessed primitive for
 * subscribing to client-only state: it returns `false` during SSR and the
 * initial client render, then `true` afterward, with no extra render.
 */
function subscribe(): () => void {
  return () => {}
}

function getSnapshot(): boolean {
  return true
}

function getServerSnapshot(): boolean {
  return false
}

export function useMounted(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
