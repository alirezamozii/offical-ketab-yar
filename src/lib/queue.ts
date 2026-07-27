type TaskFunction<T = unknown> = () => Promise<T>

export interface QueueJob<T = unknown> {
  id: string
  fn: TaskFunction<T>
  addedAt: number
}

/**
 * Lightweight background task queue for executing non-blocking background operations
 * (e.g. AI processing, telemetry, email notifications) without locking HTTP responses.
 */
class SimpleTaskQueue {
  private queue: QueueJob[] = []
  private isProcessing = false

  enqueue<T>(fn: TaskFunction<T>): string {
    const id = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    this.queue.push({ id, fn, addedAt: Date.now() })
    this.processNext()
    return id
  }

  private async processNext() {
    if (this.isProcessing || this.queue.length === 0) return
    this.isProcessing = true
    const job = this.queue.shift()
    if (job) {
      try {
        await job.fn()
      } catch (err) {
        console.error(`[QueueJob ${job.id}] Background task error:`, err)
      }
    }
    this.isProcessing = false
    if (this.queue.length > 0) {
      this.processNext()
    }
  }

  get pendingCount(): number {
    return this.queue.length
  }
}

export const taskQueue = new SimpleTaskQueue()
