/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT WILL BE UNDONE. */

import type { Metadata } from 'next'
import { RootPage } from '@payloadcms/next/views'
import config from '@/payload.config'
import { importMap } from '../importMap'

type Args = {
  params: Promise<{ segments: string[] }>
  searchParams: Promise<Record<string, string | string[]>>
}

export const metadata: Metadata = {
  title: 'Bookzi Admin',
  description: 'Content management system for Bookzi',
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function PayloadAdmin({ params, searchParams }: Args) {
  return (
    <RootPage
      config={Promise.resolve(config)}
      importMap={importMap}
      params={params}
      searchParams={searchParams}
    />
  )
}

