import { Prisma } from '@prisma/client'
import { db } from './db'

/** Retry a complete serializable transaction when concurrent writers conflict. */
export async function serializable<T>(work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await db.$transaction(work, { isolationLevel: 'Serializable' })
    } catch (error) {
      const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined
      if (attempt >= 2 || (code !== 'P2034' && code !== 'P2002')) throw error
    }
  }
}
