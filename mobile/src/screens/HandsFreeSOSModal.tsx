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
