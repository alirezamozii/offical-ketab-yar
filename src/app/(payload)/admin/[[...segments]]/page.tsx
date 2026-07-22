/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT WILL BE UNDONE. */

import type { Metadata } from 'next'
import { RootPage } from '@payloadcms/next/views'
import config from '@/payload.config'
import { importMap } from '@/payload/importMap'

type Args = {
  params: Promise<{ segments: string[] }>
  searchParams: Promise<Record<string, string | string[]>>
}

export const metadata: Metadata = {
  title: 'Ketab-Yar Admin',
  description: 'Content management system for Ketab-Yar',
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

