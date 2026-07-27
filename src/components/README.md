# Component Hierarchy & Architecture

This directory houses all React components organized by feature module and reusability.

## Directory Structure

```
src/components/
├── analytics/           # Monitoring & Web Vitals trackers (<WebVitals />)
├── layout/              # App shell, navigation, header, footer, skip link
├── onboarding/          # User onboarding wizard & level selector
├── providers/           # Context providers (Theme, Auth, Query, SmoothScroll)
├── pwa/                 # Service Worker registration, install prompt, offline banner
├── reader/              # Core reading environment (page flip, dictionary, AI chat)
├── ui/                  # Shadcn UI base primitives (Button, Dialog, Card, Toaster)
```

## Component Guidelines
1. **RTL First**: All UI components are designed for Right-to-Left (Persian) with bilingual fallback for English text.
2. **Server vs Client**: Components default to Server Components (`RSC`). Add `'use client'` explicitly only when interactive state, hooks, or event listeners are required.
3. **Accessibility**: All interactive elements include standard `aria-*` attributes, focus indicators, and unique IDs for automated testing.
