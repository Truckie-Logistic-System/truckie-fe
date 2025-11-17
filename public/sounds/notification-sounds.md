# 🔊 Notification Sound Effects

This project uses **ZZFX** - a tiny JavaScript sound generator library for creating rich sound effects without audio files.

## Sound Types

| Type | Description | Use Case | Effect | Frequency |
|------|-------------|----------|--------|-----------|
| **SUCCESS** | Ascending powerup with shimmer | Order delivered, actions completed | Uplifting, positive feedback | 261.63Hz (C4) + pitch jump |
| **INFO** | Soft gentle blip | Status updates, general info | Non-intrusive, subtle | 520Hz (C5) |
| **WARNING** | Clear double-beep alert | Cancellations, warnings | Attention-grabbing, urgent | 800Hz |
| **ERROR** | Harsh descending buzz | Errors, troubles | Demanding attention, critical | 400Hz descending |
| **PAYMENT_SUCCESS** | Rich coin collect | Payment confirmations | Rewarding, satisfying | 987.77Hz (B5) + harmonics |
| **NEW_ISSUE** | Crisp notification bell | New issues, incidents | Clear, professional | 659.25Hz (E5) |
| **SEAL_CONFIRM** | Mechanical click | Confirmations, seal updates | Quick, satisfying | 220Hz (A3) |

## Implementation

### Basic Usage
```typescript
import { playNotificationSound, NotificationSoundType } from '@/utils/notificationSound';

// Play success sound
playNotificationSound(NotificationSoundType.SUCCESS);

// Play payment sound
playNotificationSound(NotificationSoundType.PAYMENT_SUCCESS);
```

### Customization

Want to customize sounds? Use the **ZzFX Sound Designer**:
https://killedbyapixel.github.io/ZzFX/

1. Design your sound
2. Copy the generated array
3. Update `soundPresets` in `notificationSound.ts`

### Sound Characteristics

#### SUCCESS - Ascending Powerup
```javascript
[1.2,,261.63,.01,.15,.3,1,1.8,,,150,.05,.01,,,.05]
```
- Base frequency: 261.63Hz (C4 note - Middle C)
- Pitch jump: +150 (ascending feel)
- Shape: Sine wave (1) with curve 1.8
- Duration: ~460ms (attack 10ms + sustain 150ms + release 300ms)
- Effect: Positive, uplifting powerup sound

#### PAYMENT_SUCCESS - Coin Collect
```javascript
[1.8,,987.77,.01,.12,.25,1,2.2,,,300,.05,,,,,,.8]
```
- Base frequency: 987.77Hz (B5 note)
- Pitch jump: +300 (strong upward shimmer)
- Shape: Sine wave with rich harmonics (curve 2.2)
- Sustain volume: 0.8 (fuller sound)
- Duration: ~380ms
- Effect: Rewarding, satisfying coin collection

#### ERROR - Descending Buzz
```javascript
[1.5,,400,.02,.15,.25,,.6,,-50,-200,.05,.1]
```
- Base frequency: 400Hz (descending from there)
- Slide: -50 (continuous pitch drop)
- Pitch jump: -200 (harsh downward sweep)
- Shape curve: 0.6 (distorted)
- Duration: ~420ms
- Effect: Urgent, attention-demanding alert

#### NEW_ISSUE - Notification Bell
```javascript
[1.2,,659.25,.01,.15,.35,1,1.5,,,100,.05,,,,,,.6]
```
- Base frequency: 659.25Hz (E5 note)
- Pitch jump: +100 (bell-like ring)
- Shape: Sine wave with natural decay
- Sustain volume: 0.6 (natural fade)
- Duration: ~510ms
- Effect: Professional notification bell

#### WARNING - Alert Beep
```javascript
[1,,800,.01,.08,.15,,.8,,,,,,,,.05,,,.05]
```
- Base frequency: 800Hz (clear, attention-getting)
- Short attack (10ms) and sustain (80ms)
- Bit crush: 0.05 (slight digital edge)
- Duration: ~240ms
- Effect: Clear, urgent warning tone

#### INFO - Gentle Blip
```javascript
[.6,.05,520,.01,.08,.12,,,,,,,,,,,,.1]
```
- Base frequency: 520Hz (C5 note)
- Low volume: 0.6 (non-intrusive)
- Slight randomness: 0.05
- Very short: ~210ms
- Effect: Subtle, gentle notification

#### SEAL_CONFIRM - Mechanical Click
```javascript
[.8,,220,.01,.03,.08,,,,,,,,,,,,.2]
```
- Base frequency: 220Hz (A3 note)
- Very short: attack 10ms + sustain 30ms + release 80ms = ~120ms
- Low sustain volume: 0.2 (crisp, not lingering)
- Effect: Quick, satisfying mechanical click

## Benefits of ZZFX

✅ **No audio files needed** - All sounds generated programmatically
✅ **Tiny size** - < 1KB minified + gzipped
✅ **No dependencies** - Pure JavaScript
✅ **Customizable** - Easy to modify presets
✅ **Browser compatible** - Works in all modern browsers
✅ **No loading delay** - Instant playback

## References

- ZZFX Library: https://github.com/KilledByAPixel/ZzFX
- Sound Designer: https://killedbyapixel.github.io/ZzFX/
- Documentation: https://github.com/KilledByAPixel/ZzFX#readme
