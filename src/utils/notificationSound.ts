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
  // Success - Bright ascending powerup sound with shimmer
  // Tăng dần tần số tạo cảm giác tích cực, thành công
  success: [1.2,,261.63,.01,.15,.3,1,1.8,,,150,.05,.01,,,.05],
  
  // Info - Soft gentle blip, non-intrusive
  // Âm thanh nhẹ nhàng, không gây phiền nhiễu
  info: [.6,.05,520,.01,.08,.12,,,,,,,,,,,,.1],
  
  // Warning - Clear double-beep alert pattern
  // 2 tiếng bíp ngắn rõ ràng để cảnh báo
  warning: [1,,800,.01,.08,.15,,.8,,,,,,,,.05,,,.05],
  
  // Error - Harsh descending buzz for urgent attention
  // Âm thanh giảm dần, khó chịu để thu hút sự chú ý
  error: [1.5,,400,.02,.15,.25,,.6,,-50,-200,.05,.1],
  
  // Payment Success - Rewarding coin collect with rich harmonics
  // Âm thanh phần thưởng giống thu thập coin trong game
  payment: [1.8,,987.77,.01,.12,.25,1,2.2,,,300,.05,,,,,,.8],
  
  // New Issue - Crisp notification bell with decay
  // Chuông thông báo rõ ràng với độ vang tự nhiên
  issue: [1.2,,659.25,.01,.15,.35,1,1.5,,,100,.05,,,,,,.6],
  
  // Seal Confirm - Satisfying mechanical click
  // Âm click cơ học ngắn, tạo cảm giác xác nhận rõ ràng
  seal: [.8,,220,.01,.03,.08,,,,,,,,,,,,.2],
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
