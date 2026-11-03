import React, { useState, useEffect } from 'react';
import { Mic, Activity, AlertOctagon, X, Volume2, Check } from 'lucide-react';

interface HandsFreeProps {
  onTriggerSOS: (method: string) => void;
  onClose: () => void;
}

export const HandsFreeSOSModal: React.FC<HandsFreeProps> = ({ onTriggerSOS, onClose }) => {
  const [listening, setListening] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [shakeSensitivity, setShakeSensitivity] = useState(7);

  // Web Speech Recognition setup
  useEffect(() => {
    let recognition: any = null;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('')
          .toLowerCase();
        
        setVoiceText(transcript);

        if (transcript.includes('help') || transcript.includes('emergency') || transcript.includes('save me')) {
          onTriggerSOS('voice_activation');
          recognition.stop();
        }
      };

      if (listening) {
        recognition.start();
      }
    }

    return () => {
      if (recognition) recognition.stop();
    };
  }, [listening, onTriggerSOS]);

  // Real Hardware Accelerometer Phone Shake Detection
  // STRICT MODE — same policy as LiveJourneyScreen: only high-intensity shaking triggers.
  useEffect(() => {
    // Desktop / non-motion devices: never register the listener.
    const supportsMotion = typeof window !== 'undefined' && 'DeviceMotionEvent' in window;
    const isTouchDevice = typeof window !== 'undefined' &&
      ('ontouchstart' in window || (navigator && navigator.maxTouchPoints > 0));
    if (!supportsMotion || !isTouchDevice) return;

    let lastX = 0, lastY = 0, lastZ = 0;
    let lastUpdate = 0;
    let shakeCount = 0;
    let lastShakeTime = 0;
    let lastTriggerTime = 0;
    let initialized = false;
    let consecutiveHits = 0;

    // Map sensitivity 1–10 to a high threshold 80–59 (higher sensitivity → slightly lower,
    // but never below 59 — still requires a violent shake).
    const threshold = Math.max(59, 89 - shakeSensitivity * 3);

    const SHAKE_WINDOW_MS = 1500;
    const REQUIRED_SHAKES = 4;
    const REQUIRED_CONSECUTIVE = 2;
    const COOLDOWN_MS = 8000;
    const SAMPLE_INTERVAL_MS = 120;

    const handleMotion = (event: DeviceMotionEvent) => {
      // ONLY use gravity-free acceleration. accelerationIncludingGravity jitters even
      // on a still phone and caused constant false SOS triggers.
      const accel = event.acceleration;
      if (!accel || accel.x === null || accel.y === null || accel.z === null) return;
      const cx: number = accel.x;
      const cy: number = accel.y;
      const cz: number = accel.z;

      const curTime = Date.now();
      if (curTime - lastTriggerTime < COOLDOWN_MS) return;

      if ((curTime - lastUpdate) > SAMPLE_INTERVAL_MS) {
        lastUpdate = curTime;

        if (!initialized) {
          lastX = cx;
          lastY = cy;
          lastZ = cz;
          initialized = true;
          return;
        }

        const dx = cx - lastX;
        const dy = cy - lastY;
        const dz = cz - lastZ;
        const magnitude = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (magnitude > threshold) {
          consecutiveHits++;
          if (consecutiveHits >= REQUIRED_CONSECUTIVE) {
            consecutiveHits = 0;
            const now = Date.now();
            if (now - lastShakeTime < SHAKE_WINDOW_MS) {
              shakeCount++;
              if (shakeCount >= REQUIRED_SHAKES) {
                onTriggerSOS('shake_gesture');
                shakeCount = 0;
                lastTriggerTime = now;
              }
            } else {
              shakeCount = 1;
            }
            lastShakeTime = now;
          }
        } else {
          consecutiveHits = 0;
        }

        lastX = cx;
        lastY = cy;
        lastZ = cz;
      }
    };

    if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
      window.addEventListener('devicemotion', handleMotion);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('devicemotion', handleMotion);
      }
    };
  }, [shakeSensitivity, onTriggerSOS]);

  const handleSimulateShake = () => {
    onTriggerSOS('shake_gesture');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ textAlign: 'left' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Hands-Free SOS Settings</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Voice Trigger Section */}
        <div style={{ backgroundColor: '#f8fafc', borderRadius: '14px', padding: '1rem', marginBottom: '1.25rem', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
            <Mic size={22} color="#2563eb" />
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Voice Trigger Detection</h4>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.65rem' }}>
            Say emergency wake phrase <strong style={{ color: '#dc2626' }}>"Help me"</strong> or <strong>"Emergency"</strong> to activate SOS without touching your phone.
          </p>
          <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '0.45rem 0.65rem', fontSize: '0.74rem', color: '#065f46', marginBottom: '0.85rem' }}>
            ✅ <strong>Automatic Journey Protection:</strong> Voice detection turns on automatically in the background as soon as you start any journey!
          </div>

          <button 
            className={`btn-large ${listening ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => setListening(!listening)}
            style={{ fontSize: '0.85rem', padding: '0.6rem 1rem' }}
          >
            {listening ? <><Volume2 size={16} /> Listening... (Say "Help me")</> : <><Mic size={16} /> Start Voice Detection Test</>}
          </button>

          {voiceText && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: '#334155', fontStyle: 'italic' }}>
              Heard: "{voiceText}"
            </div>
          )}
        </div>

        {/* Shake Sensor Section */}
        <div style={{ backgroundColor: '#f8fafc', borderRadius: '14px', padding: '1rem', marginBottom: '1.25rem', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
            <Activity size={22} color="#ea580c" />
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Shake Gesture Activation</h4>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.85rem' }}>
            Vigorously shake your phone 3 times to trigger immediate emergency alert.
          </p>

          <div style={{ marginBottom: '0.85rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>
              Shake Sensitivity: {shakeSensitivity} / 10
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={shakeSensitivity}
              onChange={(e) => setShakeSensitivity(parseInt(e.target.value))}
              style={{ width: '100%', marginTop: '0.25rem' }}
            />
          </div>

          <button className="btn-large btn-secondary" onClick={handleSimulateShake} style={{ fontSize: '0.85rem' }}>
            <AlertOctagon size={16} color="#dc2626" /> Simulate Phone Shake Trigger
          </button>
        </div>

        <button className="btn-large btn-primary" onClick={onClose}>
          <Check size={18} /> Save Hands-Free Configuration
        </button>
      </div>
    </div>
  );
};
