/**
 * Utility for playing notification sounds using ZZFX
 * ZZFX - Zuper Zmall Zound Zynth
 */
// Declare ZZFX - will be available globally if zzfx library is loaded
declare global {
  const zzfx: any;
  const zzfxX: any; // ZZFX AudioContext
}

// Use zzfx (lowercase) which is the global function
const ZZFX = typeof zzfx !== 'undefined' ? zzfx : null;

/**
 * AudioContext manager to handle browser restrictions
 * Browsers require user interaction before AudioContext can start
 */
class AudioContextManager {
  private static instance: AudioContextManager;
  private isAudioContextReady: boolean = false;
  private initPromise: Promise<void> | null = null;
  private userInteractionListener: ((event: Event) => void) | null = null;
  private pendingSounds: Array<() => void> = [];
  private isInitializing: boolean = false;
  private hasAttemptedInit: boolean = false;

  private constructor() {
    this.initializeImmediately();
    this.initializeOnUserInteraction();
  }

  static getInstance(): AudioContextManager {
    if (!AudioContextManager.instance) {
      AudioContextManager.instance = new AudioContextManager();
    }
    return AudioContextManager.instance;
  }

  /**
   * Try to initialize AudioContext immediately (will be suspended until user interaction)
   */
  private initializeImmediately(): void {
    if (this.hasAttemptedInit) return;
    this.hasAttemptedInit = true;

    try {
      // Try to create and resume AudioContext immediately
      // This will likely be suspended by browser until user interaction
      if (typeof zzfxX !== 'undefined' && zzfxX.resume) {
        zzfxX.resume().then(() => {
          this.isAudioContextReady = true;
          console.log('✅ AudioContext ready immediately');
          this.playPendingSounds();
        }).catch(() => {
          console.log('⏳ AudioContext suspended, waiting for user interaction');
        });
      }
      
      // Alternative: create our own AudioContext
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioContext.state === 'suspended') {
        // Try to resume anyway - browser will block until user interaction
        audioContext.resume().then(() => {
          this.isAudioContextReady = true;
          console.log('✅ AudioContext ready immediately');
          this.playPendingSounds();
        }).catch(() => {
          console.log('⏳ AudioContext suspended, waiting for user interaction');
        });
      } else if (audioContext.state === 'running') {
        this.isAudioContextReady = true;
        console.log('✅ AudioContext already running');
        this.playPendingSounds();
      }
    } catch {
      console.log('⏳ Cannot initialize AudioContext yet, waiting for user interaction');
    }
  }

  /**
   * Initialize AudioContext on first user interaction
   * This handles browser restrictions that require user gesture
   */
  private initializeOnUserInteraction(): void {
    if (this.isAudioContextReady || this.isInitializing) return;

    // Create listener that will initialize audio context on first interaction
    this.userInteractionListener = async () => {
      await this.resumeAudioContext();
    };

    // Listen for common user interactions
    const events = ['click', 'keydown', 'mousedown', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, this.userInteractionListener!, { once: true });
    });
  }

  /**
   * Resume AudioContext and mark as ready
   */
  private async resumeAudioContext(): Promise<void> {
    if (this.isAudioContextReady || this.isInitializing) return;

    this.isInitializing = true;

    try {
      // Try to resume ZZFX AudioContext if available
      if (typeof zzfxX !== 'undefined' && zzfxX.resume) {
        await zzfxX.resume();
      }
      
      // Alternative: create our own AudioContext if ZZFX doesn't expose one
      if (!this.isAudioContextReady) {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }
      }

      this.isAudioContextReady = true;
      console.log('✅ AudioContext ready for notification sounds');
      
      // Play any pending sounds that were queued
      this.playPendingSounds();
      
      // Clean up event listeners
      this.cleanup();
    } catch (error) {
      console.warn('⚠️ Failed to initialize AudioContext:', error);
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Play sounds that were pending while audio context was initializing
   */
  private playPendingSounds(): void {
    const pending = [...this.pendingSounds];
    this.pendingSounds = [];
    
    // Play pending sounds with small delays to avoid overlap
    pending.forEach((playSound, index) => {
      setTimeout(playSound, index * 100);
    });
  }

  /**
   * Queue a sound to be played when audio context is ready
   */
  queueSound(playSound: () => void): void {
    if (this.isAudioContextReady) {
      playSound();
    } else {
      this.pendingSounds.push(playSound);
      // Trigger initialization if not already in progress
      if (!this.isInitializing) {
        this.initializeOnUserInteraction();
      }
      
      // Show user notification on first sound attempt if not ready
      this.showUserInteractionHint();
    }
  }

  /**
   * Show a subtle hint to user that interaction is needed for sounds
   */
  private showUserInteractionHint(): void {
    // Only show hint once per session
    const hintShown = sessionStorage.getItem('audioContextHintShown');
    if (hintShown) return;
    
    // Create a subtle notification
    const hint = document.createElement('div');
    hint.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(24, 144, 255, 0.9);
      color: white;
      padding: 12px 16px;
      border-radius: 6px;
      font-size: 14px;
      z-index: 9999;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      cursor: pointer;
      transition: opacity 0.3s;
      max-width: 300px;
    `;
    hint.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span>🔊</span>
        <div>
          <strong>Bật âm thanh</strong><br>
          <span style="font-size: 12px; opacity: 0.9;">Nhấn vào đây để kích hoạt thông báo âm thanh</span>
        </div>
      </div>
    `;
    
    // Add click handler to initialize audio and remove hint
    hint.addEventListener('click', () => {
      this.resumeAudioContext();
      hint.style.opacity = '0';
      setTimeout(() => {
        if (hint.parentNode) {
          hint.parentNode.removeChild(hint);
        }
      }, 300);
    });
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (hint.parentNode) {
        hint.style.opacity = '0';
        setTimeout(() => {
          if (hint.parentNode) {
            hint.parentNode.removeChild(hint);
          }
        }, 300);
      }
    }, 10000);
    
    document.body.appendChild(hint);
    sessionStorage.setItem('audioContextHintShown', 'true');
    
    // Fade in animation
    setTimeout(() => {
      hint.style.opacity = '1';
    }, 100);
  }

  /**
   * Check if audio context is ready for playback
   */
  isReady(): boolean {
    return this.isAudioContextReady;
  }

  /**
   * Get promise that resolves when audio context is ready
   * Returns immediately if already ready, otherwise waits with timeout
   */
  async whenReady(): Promise<void> {
    if (this.isAudioContextReady) {
      return Promise.resolve();
    }

    // Create a promise that will resolve when ready or timeout
    return new Promise<void>((resolve) => {
      const checkReady = () => {
        if (this.isAudioContextReady) {
          resolve();
        } else {
          // Check again after 100ms, but with a maximum timeout
          setTimeout(checkReady, 100);
        }
      };
      
      // Start checking
      checkReady();
      
      // Set a timeout to resolve anyway (prevents hanging)
      setTimeout(() => {
        if (!this.isAudioContextReady) {
          console.log('⏰ AudioContext initialization timeout');
          resolve();
        }
      }, 2000); // 2 second timeout
    });
  }

  /**
   * Clean up event listeners
   */
  private cleanup(): void {
    if (this.userInteractionListener) {
      const events = ['click', 'keydown', 'mousedown', 'touchstart'];
      events.forEach(event => {
        document.removeEventListener(event, this.userInteractionListener!);
      });
      this.userInteractionListener = null;
    }
  }
}

export enum NotificationSoundType {
  SUCCESS = 'success',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  PAYMENT_SUCCESS = 'payment',
  NEW_ISSUE = 'issue',
  SEAL_CONFIRM = 'seal',
  URGENT = 'urgent',
}

/**
 * ZZFX Sound Presets for different notification types
 * Format: [volume, randomness, frequency, attack, sustain, release, shape, shapeCurve, 
 *          slide, deltaSlide, pitchJump, pitchJumpTime, repeatTime, noise, modulation, 
 *          bitCrush, delay, sustainVolume, decay, tremolo, filter]
 * Generated using ZzFX Sound Designer: https://killedbyapixel.github.io/ZzFX/
 * 
 * Reference samples from ZzFX library:
 * - Game Over: [,,925,.04,.3,.6,1,.3,,6.27,-184,.09,.17]
 * - Heart: [,,537,.02,.02,.22,1,1.59,-6.98,4.97]
 * - Piano: [1.5,.8,270,,.1,,1,1.5,,,,,,,,.1,.01]
 * - Drum: [,,129,.01,,.15,,,,,,,,5]
 */
const soundPresets = {
  // Success - Subtle positive confirmation tone
  // Âm thanh xác nhận nhẹ nhàng, chuyên nghiệp
  success: [.5,,350,.01,.06,.15,1,1.2,,,30,.02],
  
  // Info - Very soft notification blip
  // Âm thanh thông báo rất nhẹ, không gây phiền nhiễu
  info: [.3,,400,.005,.04,.08,1],
  
  // Warning - Gentle but clear alert
  // Cảnh báo nhẹ nhàng nhưng rõ ràng
  warning: [.6,,450,.01,.05,.12,1,1],
  
  // Error - Clear low tone for attention
  // Âm thanh rõ ràng để thu hút sự chú ý
  error: [.7,,300,.01,.08,.15,1,.8,,-20],
  
  // Payment Success - Pleasant confirmation chime
  // Âm thanh xác nhận thanh toán dễ chịu
  payment: [.6,,520,.01,.08,.18,1,1.5,,,40,.03],
  
  // New Issue - Soft notification ping
  // Thông báo mới nhẹ nhàng
  issue: [.55,,380,.01,.07,.16,1,1.2,,,25,.02],
  
  // Seal Confirm - Crisp subtle click
  // Click nhẹ, tinh tế
  seal: [.4,,280,.005,.02,.06,1]
};

/**
 * Play notification sound based on type
 */
export const playNotificationSound = (type: NotificationSoundType) => {
  // Skip if ZZFX not available
  if (!ZZFX) {
    return;
  }

  try {
    // Get AudioContext manager instance
    const audioManager = AudioContextManager.getInstance();
    
    // Create a function to play the specific sound
    const playSound = () => {
      try {
        switch (type) {
          case NotificationSoundType.SUCCESS:
            ZZFX(...soundPresets.success);
            break;
            
          case NotificationSoundType.INFO:
            ZZFX(...soundPresets.info);
            break;
            
          case NotificationSoundType.WARNING:
            ZZFX(...soundPresets.warning);
            break;
            
          case NotificationSoundType.ERROR:
            ZZFX(...soundPresets.error);
            break;
            
          case NotificationSoundType.PAYMENT_SUCCESS:
            // Coin collect sound effect
            ZZFX(...soundPresets.payment);
            break;
            
          case NotificationSoundType.NEW_ISSUE:
            // Notification ping
            ZZFX(...soundPresets.issue);
            break;
            
          case NotificationSoundType.SEAL_CONFIRM:
            // Button click effect
            ZZFX(...soundPresets.seal);
            break;
            
          default:
            ZZFX(...soundPresets.info);
        }
      } catch (error) {
        console.warn('Failed to play ZZFX sound:', error);
      }
    };

    // Queue the sound to be played when audio context is ready
    audioManager.queueSound(playSound);
    
  } catch (error) {
    console.warn('Failed to queue notification sound:', error);
  }
};

/**
 * Play a double beep for important notifications (backward compatibility)
 */
export const playImportantNotificationSound = () => {
  // Skip if ZZFX not available
  if (!ZZFX) {
    return;
  }

  try {
    // Get AudioContext manager instance
    const audioManager = AudioContextManager.getInstance();
    
    // Create a function to play the double beep
    const playDoubleBeep = () => {
      try {
        ZZFX(...soundPresets.success);
        setTimeout(() => ZZFX(...soundPresets.success), 150);
      } catch (error) {
        console.warn('Failed to play ZZFX double beep:', error);
      }
    };

    // Queue the sound to be played when audio context is ready
    audioManager.queueSound(playDoubleBeep);
    
  } catch (error) {
    console.warn('Failed to queue important notification sound:', error);
  }
};

/**
 * Initialize audio context manually (optional)
 * Call this if you want to pre-initialize audio context
 */
export const initializeAudioContext = async (): Promise<void> => {
  const audioManager = AudioContextManager.getInstance();
  await audioManager.whenReady();
};

/**
 * Check if audio context is ready
 */
export const isAudioContextReady = (): boolean => {
  const audioManager = AudioContextManager.getInstance();
  return audioManager.isReady();
};
