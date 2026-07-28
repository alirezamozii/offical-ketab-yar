'use client'

import * as React from 'react'
import { useReminders } from '@/hooks/use-reminders'

/**
 * NotificationsProvider
 * ---------------------------------------------------------------
 * App-wide Reading Reminders provider.
 * Runs the `useReminders()` hook in the background to handle daily
 * reminder timers and streak tracking.
 * Renders zero UI banners to prevent visual clutter and ad-like nag screens.
 * Users can enable notification permissions gracefully in /settings.
 * ---------------------------------------------------------------
 */
export function NotificationsProvider({
  children,
}: {
  children?: React.ReactNode
}) {
  // Mount background reminders hook for daily reading & streak notifications
  useReminders()

  return <>{children}</>
}
