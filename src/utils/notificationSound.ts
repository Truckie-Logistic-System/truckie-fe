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
  seal: [.4,,280,.005,.02,.06,1],
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
