/**
 * Smart Notification Queue System
 * Prevents notification spam and respects user context
 */

export type NotificationType = 'xp' | 'level_up' | 'achievement' | 'streak' | 'milestone'

export interface QueuedNotification {
    id: string
    type: NotificationType
    title: string
    description: string
    icon?: string
    xpAmount?: number
    timestamp: number
}

class NotificationQueue {
    private queue: QueuedNotification[] = []
    private isReading: boolean = false
    private lastShownTime: number = 0
    private readonly MIN_INTERVAL = 3000 // 3 seconds between notifications
    private readonly MAX_QUEUE_SIZE = 10

    /**
     * Set reading mode (suppress notifications during reading)
     */
    setReadingMode(isReading: boolean) {
        this.isReading = isReading

        // When exiting reading mode, show queued notifications
        if (!isReading && this.queue.length > 0) {
            setTimeout(() => this.processQueue(), 1000)
        }
    }

    /**
     * Add notification to queue
     */
    add(notification: Omit<QueuedNotification, 'id' | 'timestamp'>) {
        // Prevent queue overflow
        if (this.queue.length >= this.MAX_QUEUE_SIZE) {
            this.queue.shift() // Remove oldest
        }

        const queuedNotification: QueuedNotification = {
            ...notification,
            id: `${Date.now()}-${Math.random()}`,
            timestamp: Date.now()
        }

        this.queue.push(queuedNotification)

        // If not reading, process immediately
        if (!this.isReading) {
            this.processQueue()
        }
    }

    /**
     * Process queued notifications
     */
    private processQueue() {
        if (this.queue.length === 0 || this.isReading) return

        const now = Date.now()
        const timeSinceLastShown = now - this.lastShownTime

        // Respect minimum interval
        if (timeSinceLastShown < this.MIN_INTERVAL) {
            setTimeout(() => this.processQueue(), this.MIN_INTERVAL - timeSinceLastShown)
            return
        }

        // Group similar notifications
        const grouped = this.groupNotifications()

        // Show first group
        if (grouped.length > 0) {
            this.showNotification(grouped[0])
            this.lastShownTime = Date.now()

            // Process next after interval
            if (this.queue.length > 0) {
                setTimeout(() => this.processQueue(), this.MIN_INTERVAL)
            }
        }
    }

    /**
     * Group similar notifications to reduce spam
     */
    private groupNotifications(): QueuedNotification[] {
        if (this.queue.length === 0) return []

        const groups: { [key: string]: QueuedNotification[] } = {}

        // Group by type
        this.queue.forEach(notification => {
            if (!groups[notification.type]) {
                groups[notification.type] = []
            }
            groups[notification.type].push(notification)
        })

        // Combine XP notifications
        if (groups.xp && groups.xp.length > 1) {
            const totalXP = groups.xp.reduce((sum, n) => sum + (n.xpAmount || 0), 0)
            const combined: QueuedNotification = {
                id: `combined-xp-${Date.now()}`,
                type: 'xp',
                title: `+${totalXP} XP کسب کردی!`,
                description: `از ${groups.xp.length} فعالیت مختلف`,
                icon: '⚡',
                xpAmount: totalXP,
                timestamp: Date.now()
            }
            this.queue = this.queue.filter(n => n.type !== 'xp')
            return [combined]
        }

        // Return first notification
        const first = this.queue.shift()
        return first ? [first] : []
    }

    /**
     * Show notification using toast
     */
    private showNotification(notification: QueuedNotification) {
        // Import toast dynamically to avoid circular dependencies
        import('sonner').then(({ toast }) => {
            switch (notification.type) {
                case 'xp':
                    toast.success(notification.title, {
                        description: notification.description,
                        icon: notification.icon || '⚡',
                        duration: 2000,
                    })
                    break

                case 'level_up':
                    toast.success(notification.title, {
                        description: notification.description,
                        icon: notification.icon || '🎉',
                        duration: 4000,
                    })
                    break

                case 'achievement':
                    toast.success(notification.title, {
                        description: notification.description,
                        icon: notification.icon || '🏆',
                        duration: 5000,
                    })
                    break

                case 'streak':
                    toast.success(notification.title, {
                        description: notification.description,
                        icon: notification.icon || '🔥',
                        duration: 3000,
                    })
                    break

                case 'milestone':
                    toast.success(notification.title, {
                        description: notification.description,
                        icon: notification.icon || '🌟',
                        duration: 4000,
                    })
                    break
            }
        })
    }

    /**
     * Clear all queued notifications
     */
    clear() {
        this.queue = []
    }

    /**
     * Get queue size
     */
    getQueueSize(): number {
        return this.queue.length
    }
}

// Singleton instance
export const notificationQueue = new NotificationQueue()

/**
 * Helper functions for common notifications
 */

export function notifyXPGain(xp: number, source?: string) {
    notificationQueue.add({
        type: 'xp',
        title: `+${xp} XP`,
        description: source || 'تجربه کسب کردی!',
        icon: '⚡',
        xpAmount: xp
    })
}

export function notifyLevelUp(newLevel: number, title: string) {
    notificationQueue.add({
        type: 'level_up',
        title: `سطح ${newLevel} 🎉`,
        description: `تبریک! به ${title} رسیدی`,
        icon: '🎉'
    })
}

export function notifyAchievement(name: string, description: string, icon: string, points: number) {
    notificationQueue.add({
        type: 'achievement',
        title: `دستاورد جدید: ${name}`,
        description: `${description} (+${points} XP)`,
        icon: icon
    })
}

export function notifyStreak(days: number) {
    notificationQueue.add({
        type: 'streak',
        title: `استریک ${days} روزه! 🔥`,
        description: 'عالی! استریک خود را حفظ کردی',
        icon: '🔥'
    })
}

export function notifyMilestone(title: string, description: string) {
    notificationQueue.add({
        type: 'milestone',
        title: title,
        description: description,
        icon: '🌟'
    })
}
