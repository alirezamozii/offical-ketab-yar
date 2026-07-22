'use client'

/**
 * src/components/error-boundary.tsx
 * ---------------------------------------------------------------
 * Reusable React Error Boundary class component. Wraps children and
 * catches any render-time errors, showing a graceful fallback UI
 * instead of a white screen.
 *
 * Usage:
 *   <ErrorBoundary fallback={<div>Something went wrong</div>}>
 *     <RiskyComponent />
 *   </ErrorBoundary>
 *
 * Owner: Phase 3 R-FE.5
 * ---------------------------------------------------------------
 */

import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  /** Called when an error is caught — use for logging/Sentry. */
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  /** A key that, when changed, resets the boundary (re-renders children). */
  resetKey?: string | number
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] caught:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  override componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // Reset the boundary when the resetKey changes
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: null })
    }
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      // Default fallback — compact error card
      return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/5 p-6 text-center">
          <p className="text-sm font-semibold text-red-700 dark:text-red-400">
            مشکلی پیش آمد
          </p>
          <p className="text-xs text-muted-foreground">
            این بخش قابل نمایش نیست. صفحه را تازه کنید.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
          >
            تلاش مجدد
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
