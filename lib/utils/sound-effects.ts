/**
 * Sound Effects Library
 * Provides subtle, premium audio feedback for user interactions
 * Agent 3 (Psychology) - Audio feedback enhances satisfaction
 * Agent 2 (Performance) - Lazy loaded, small file sizes
 */

class SoundEffects {
    private audioContext: AudioContext | null = null
    private enabled: boolean = true

    constructor() {
        if (typeof window !== 'undefined') {
            // Initialize AudioContext on first user interaction
            const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
            if (AudioContextClass) {
                this.audioContext = new AudioContextClass()
            }
        }
    }

    /**
     * Enable/disable sound effects
     */
    setEnabled(enabled: boolean) {
        this.enabled = enabled
    }

    /**
     * Play a sound effect
     */
    private play(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.1) {
        if (!this.enabled || !this.audioContext) return

        try {
            const oscillator = this.audioContext.createOscillator()
            const gainNode = this.audioContext.createGain()

            oscillator.connect(gainNode)
            gainNode.connect(this.audioContext.destination)

            oscillator.frequency.value = frequency
            oscillator.type = type

            gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime)
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration)

            oscillator.start(this.audioContext.currentTime)
            oscillator.stop(this.audioContext.currentTime + duration)
        } catch (error) {
            console.debug('Sound effect failed:', error)
        }
    }

    /**
     * Subtle click sound for buttons
     */
    click() {
        this.play(800, 0.05, 'sine', 0.05)
    }

    /**
     * Success sound (higher pitch, pleasant)
     */
    success() {
        this.play(880, 0.1, 'sine', 0.08)
        setTimeout(() => this.play(1046, 0.15, 'sine', 0.08), 50)
    }

    /**
     * Error sound (lower pitch, attention-grabbing)
     */
    error() {
        this.play(200, 0.2, 'sawtooth', 0.1)
    }

    /**
     * XP gain sound (quick, satisfying)
     */
    xp() {
        this.play(523, 0.08, 'sine', 0.06)
        setTimeout(() => this.play(659, 0.08, 'sine', 0.06), 40)
        setTimeout(() => this.play(784, 0.12, 'sine', 0.06), 80)
    }

    /**
     * Celebration sound (triumphant sequence)
     */
    celebration() {
        const notes = [523, 659, 784, 1046] // C, E, G, C (major chord)
        notes.forEach((note, index) => {
            setTimeout(() => this.play(note, 0.3, 'sine', 0.08), index * 100)
        })
    }

    /**
     * Page turn sound (subtle whoosh)
     */
    pageTurn() {
        this.play(400, 0.1, 'sine', 0.03)
    }

    /**
     * Achievement unlock sound (special, memorable)
     */
    achievement() {
        this.play(659, 0.15, 'sine', 0.1)
        setTimeout(() => this.play(784, 0.15, 'sine', 0.1), 100)
        setTimeout(() => this.play(1046, 0.25, 'sine', 0.1), 200)
        setTimeout(() => this.play(1318, 0.3, 'sine', 0.1), 300)
    }
}

// Singleton instance
let soundEffectsInstance: SoundEffects | null = null

function getSoundEffects(): SoundEffects {
    if (!soundEffectsInstance) {
        soundEffectsInstance = new SoundEffects()
    }
    return soundEffectsInstance
}

// Convenience exports
export const soundEffects = {
    click: () => getSoundEffects().click(),
    success: () => getSoundEffects().success(),
    error: () => getSoundEffects().error(),
    xp: () => getSoundEffects().xp(),
    celebration: () => getSoundEffects().celebration(),
    pageTurn: () => getSoundEffects().pageTurn(),
    achievement: () => getSoundEffects().achievement(),
    setEnabled: (enabled: boolean) => getSoundEffects().setEnabled(enabled),
}
