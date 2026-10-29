import React, { useState } from 'react';
import { ShieldCheck, Users, MapPin, AlertOctagon, ChevronRight, Check } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const slides = [
    {
      title: "Your Journey. Your Safety.",
      subtitle: "Continuous public transport route monitoring powered by AI anomaly detection and 0.5 km corridor geofencing.",
      icon: <ShieldCheck size={56} color="#2563eb" />,
      color: "#2563eb"
    },
    {
      title: "Add Trusted Contacts",
      subtitle: "Family and friends receive instant location updates and emergency alerts during unusual travel conditions.",
      icon: <Users size={56} color="#16a34a" />,
      color: "#16a34a"
    },
    {
      title: "Enable Location Safety",
      subtitle: "Your location is used solely to verify journey corridor progress. Data is encrypted and private.",
      icon: <MapPin size={56} color="#ea580c" />,
      color: "#ea580c"
    },
    {
      title: "Set Up Discreet SOS",
      subtitle: "Activate emergency alerts discreetly via one-tap countdown, shake gesture, or hands-free voice command.",
      icon: <AlertOctagon size={56} color="#dc2626" />,
      color: "#dc2626"
    }
  ];

  const current = slides[step];

  return (
    <div style={{ padding: '2rem 1.5rem', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: '#ffffff' }}>
      <div style={{ display: 'flex', justifyContent: 'center', margin: '2rem 0' }}>
        <div style={{
          width: '100px',
          height: '100px',
          borderRadius: '24px',
          backgroundColor: `${current.color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {current.icon}
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem', color: '#0f172a' }}>
          {current.title}
        </h2>
        <p style={{ fontSize: '0.95rem', color: '#64748b', lineHeight: 1.6 }}>
          {current.subtitle}
        </p>
      </div>

      <div>
        {/* Pagination Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
          {slides.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === step ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                backgroundColor: i === step ? current.color : '#e2e8f0',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>

        {step < slides.length - 1 ? (
          <button className="btn-large btn-primary" onClick={() => setStep(step + 1)}>
            Continue <ChevronRight size={18} />
          </button>
        ) : (
          <button className="btn-large btn-primary" style={{ backgroundColor: '#16a34a' }} onClick={onComplete}>
            Get Started <Check size={18} />
          </button>
        )}
      </div>
    </div>
  );
};
