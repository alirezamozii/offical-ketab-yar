import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export interface LogAuditOptions {
  actorId?: string | null
  action: string
  target: string
  details?: Record<string, unknown> | null
  ipHash?: string | null
}

/**
 * Log a privileged admin or security-sensitive action to the AuditLog table.
 * Asynchronous & non-blocking — catches and logs write errors so main request path never fails.
 */
export async function logAuditAction(options: LogAuditOptions): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        actorId: options.actorId ?? null,
        action: options.action,
        target: options.target,
        details: options.details ? (options.details as unknown as Prisma.InputJsonValue) : undefined,
        ipHash: options.ipHash ?? null,
      },
    })
  } catch (err) {
    console.error('[audit] Failed to record audit log:', err)
  }
}
