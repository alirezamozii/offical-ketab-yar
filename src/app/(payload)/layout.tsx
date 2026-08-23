/**
 * src/app/(payload)/layout.tsx
 * ---------------------------------------------------------------
 * Root layout for the Payload CMS route group.
 *
 * Payload's RootLayout renders its own <html> element, so this
 * route group MUST have a bare passthrough layout that does NOT
 * wrap children in <html>/<body> — otherwise React will error
 * with "In HTML, <html> cannot be a child of <div>".
 *
 * By placing this file here, Next.js uses it instead of the app's
 * root layout.tsx for all routes under /(payload)/*.
 * ---------------------------------------------------------------
 */
import React from 'react'

export default function PayloadRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
