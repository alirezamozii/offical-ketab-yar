/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT WILL BE UNDONE. */

import type { Metadata } from 'next'
import { NotFoundPage, generatePageMetadata } from '@payloadcms/next/views'
import config from '@/payload.config'
import { importMap } from '@/payload/importMap'

type Args = {
  params: Promise<{ segments: string[] }>
  searchParams: Promise<Record<string, string | string[]>>
}

export const generateMetadata = ({ params, searchParams }: Args): Promise<Metadata> =>
  generatePageMetadata({ config: Promise.resolve(config), params, searchParams })

const NotFound = ({ params, searchParams }: Args) => {
  return (
    <NotFoundPage
      config={Promise.resolve(config)}
      importMap={importMap}
      params={params}
      searchParams={searchParams}
    />
  )
}

export default NotFound
