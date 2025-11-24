/**
 * Sound utility for playing notification sounds
 */

export enum SoundType {
  SUCCESS = 'success',
  INFO = 'info', 
  WARNING = 'warning',
  ERROR = 'error',
  NEW_ISSUE = 'new_issue',
  SEAL_CONFIRMATION = 'seal_confirmation'
}

class SoundManager {
  private audioContext: AudioContext | null = null;
  private sounds: Map<SoundType, AudioBuffer> = new Map();
  private isEnabled: boolean = false;

  constructor() {
    // Don't initialize audio context immediately, wait for user interaction
    this.setupUserInteractionListener();
  }

  private setupUserInteractionListener() {
    // Enable audio on first user interaction
    const enableAudio = async () => {
      if (!this.isEnabled) {

        this.initAudioContext();
        
        // Try to resume audio context immediately
        if (this.audioContext && this.audioContext.state === 'suspended') {
          try {
            await this.audioContext.resume();

          } catch (err) {
            console.warn('⚠️ [SoundUtils] Failed to auto-resume:', err);
          }
        }
        
        this.isEnabled = true;
      }
    };

    document.addEventListener('click', enableAudio, { once: true, capture: true });
    document.addEventListener('keydown', enableAudio, { once: true, capture: true });
    document.addEventListener('touchstart', enableAudio, { once: true, capture: true });
  }

  private initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    } catch (error) {
      console.warn('Audio context not supported:', error);
    }
  }

  /**
   * Manually enable audio (call this on user interaction if needed)
   */
  async enableAudio() {
    if (!this.audioContext) {
      this.initAudioContext();
    }
    
    // Resume audio context if suspended
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();

      } catch (err) {
        console.error('❌ [SoundUtils] Failed to resume audio context:', err);
        throw err;
      }
    }
    
    this.isEnabled = true;
  }
  
  /**
   * Get current audio context state
   */
  getAudioContextState(): AudioContextState | null {
    return this.audioContext?.state || null;
  }

  /**
   * Play notification sound
   */
  async playSound(type: SoundType, volume: number = 0.5) {
    try {

      if (!this.audioContext) {

        this.initAudioContext();
      }

      if (!this.audioContext) {
        console.warn('🔊 [SoundUtils] Audio context not available');
        return;
      }

      // Resume audio context if suspended (required by browser policies)
      if (this.audioContext.state === 'suspended') {

        await this.audioContext.resume();

      }

      // Generate different tones for different notification types
      const frequency = this.getFrequencyForType(type);
      const duration = this.getDurationForType(type);

      await this.playTone(frequency, duration, volume);

    } catch (error) {
      console.error('❌ [SoundUtils] Error playing sound:', error);
    }
  }

  private getFrequencyForType(type: SoundType): number {
    switch (type) {
      case SoundType.SUCCESS:
      case SoundType.SEAL_CONFIRMATION:
        return 800; // Higher pitch for success
      case SoundType.INFO:
        return 600; // Medium pitch for info
      case SoundType.WARNING:
        return 400; // Lower pitch for warning
      case SoundType.ERROR:
        return 300; // Lowest pitch for error
      case SoundType.NEW_ISSUE:
        return 500; // Medium-low pitch for new issues
      default:
        return 500;
    }
  }

  private getDurationForType(type: SoundType): number {
    switch (type) {
      case SoundType.SUCCESS:
      case SoundType.SEAL_CONFIRMATION:
        return 0.3; // Short beep for success
      case SoundType.INFO:
        return 0.2; // Very short for info
      case SoundType.WARNING:
      case SoundType.NEW_ISSUE:
        return 0.5; // Longer for warnings/issues
      case SoundType.ERROR:
        return 0.7; // Longest for errors
      default:
        return 0.3;
    }
  }

  private async playTone(frequency: number, duration: number, volume: number) {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  /**
   * Play multiple beeps for important notifications
   */
  async playMultipleBeeps(type: SoundType, count: number = 2, interval: number = 200) {
    for (let i = 0; i < count; i++) {
      await this.playSound(type);
      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
  }
}

// Export singleton instance
export const soundManager = new SoundManager();

// Convenience functions
export const playNotificationSound = (type: SoundType, volume?: number) => {
  soundManager.playSound(type, volume);
};

export const playMultipleBeeps = (type: SoundType, count?: number, interval?: number) => {
  soundManager.playMultipleBeeps(type, count, interval);
};

export const enableAudio = async () => {
  await soundManager.enableAudio();
};

export const getAudioContextState = () => {
  return soundManager.getAudioContextState();
};
