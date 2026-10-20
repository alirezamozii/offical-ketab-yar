import configPromise from '@/payload.config'
import '@payloadcms/next/css'
import '@/payload/admin-design-system.css'
import '@/payload/custom.css'
import { RootLayout, handleServerFunctions } from '@payloadcms/next/layouts'
import { importMap } from './importMap'

const serverFunction = async function (args: any) {
  'use server'
  return handleServerFunctions({
    ...args,
    config: configPromise,
    importMap,
  })
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RootLayout
      config={configPromise}
      importMap={importMap}
      serverFunction={serverFunction}
      htmlProps={{ suppressHydrationWarning: true }}
    >
      {children}
    </RootLayout>
  )
}
