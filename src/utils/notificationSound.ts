/**
 * Utility for playing notification sounds using ZZFX
 * ZZFX - Zuper Zmall Zound Zynth
 */
// Declare ZZFX - will be available globally if zzfx library is loaded
declare global {
  const zzfx: any;
}

// Use zzfx (lowercase) which is the global function
const ZZFX = typeof zzfx !== 'undefined' ? zzfx : null;

export enum NotificationSoundType {
  SUCCESS = 'success',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  PAYMENT_SUCCESS = 'payment',
  NEW_ISSUE = 'issue',
  SEAL_CONFIRM = 'seal',
}

/**
 * ZZFX Sound Presets for different notification types
 * Format: [volume, pitch, attack, sustain, decay, shape, slide, pitch jump, vibrato, etc.]
 * Generated using ZzFX Sound Designer: https://killedbyapixel.github.io/ZzFX/
 */
const soundPresets = {
  // Success - Bright power up sound
  success: [1.5,,783,.01,.14,.24,,.63,7.7,3.7,-184,.09,.05],
  
  // Info - Soft blip
  info: [.5,.1,270,.04,.1,.1,,.3],
  
  // Warning - Alert siren
  warning: [1,,600,.01,.05,.3,,1.4,,,,,,.5,,.1,.01],
  
  // Error - Explosion/Error buzz
  error: [1.3,,77,.03,.08,.15,,.93,,,-302,.08,.16],
  
  // Payment Success - Coin collect with shimmer
  payment: [1.5,,1046.5,.02,.11,.19,1,1.65,,,,,,5],
  
  // New Issue - Notification bell
  issue: [1,,523,.01,.14,.14,,1.4,,,50,.05],
  
  // Seal Confirm - Click with feedback
  seal: [.7,,150,.01,.01,.1,,,,,,,,,,.1,.01],
};

/**
 * Play notification sound based on type
 */
export const playNotificationSound = (type: NotificationSoundType) => {
  // Skip if ZZFX not available
  if (!ZZFX) {
    console.debug('ZZFX not available, skipping sound');
    return;
  }

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
    console.warn('Failed to play notification sound:', error);
  }
};

/**
 * Play a double beep for important notifications (backward compatibility)
 */
export const playImportantNotificationSound = () => {
  try {
    ZZFX(...soundPresets.success);
    setTimeout(() => ZZFX(...soundPresets.success), 150);
  } catch (error) {
    console.warn('Failed to play important notification sound:', error);
  }
};
