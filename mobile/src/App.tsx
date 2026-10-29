import React, { useState } from 'react';
import { Home, Navigation, Users, Activity, User, ShieldCheck, AlertOctagon } from 'lucide-react';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { LoginScreen } from './screens/LoginScreen';
import { RegisterScreen } from './screens/RegisterScreen';
import { HomeScreen } from './screens/HomeScreen';
import { StartJourneyScreen } from './screens/StartJourneyScreen';
import { VehicleVerificationScreen } from './screens/VehicleVerificationScreen';
import { LiveJourneyScreen } from './screens/LiveJourneyScreen';
import { TrustedContactsScreen } from './screens/TrustedContactsScreen';
import { SafeLocationsScreen } from './screens/SafeLocationsScreen';
import { IncidentHistoryScreen } from './screens/IncidentHistoryScreen';
import { ProfileSettingsScreen } from './screens/ProfileSettingsScreen';
import { PrivacyScreen } from './screens/PrivacyScreen';
import { HandsFreeSOSModal } from './screens/HandsFreeSOSModal';
import { SOSCountdownModal } from './components/SOSCountdownModal';
import axios from 'axios';
import { sendEmergencyLocationUpdate } from './services/emergencyService';

export function App() {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [authToken, setAuthToken] = useState<string>('');
  const [showRegister, setShowRegister] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'journey' | 'contacts' | 'incidents' | 'profile' | 'safe_locations' | 'privacy'>('home');

  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [pendingTripData, setPendingTripData] = useState<any>(null);
  const [isJourneyMonitoring, setIsJourneyMonitoring] = useState(false);
  const [showVehicleVerification, setShowVehicleVerification] = useState(false);

  const [showSOSCountdown, setShowSOSCountdown] = useState(false);
  const [showHandsFreeModal, setShowHandsFreeModal] = useState(false);
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [activeEmergencyId, setActiveEmergencyId] = useState<string | null>(null);
  const liveLocationIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const handleLoginSuccess = (userData: any, token: string) => {
    setUser(userData);
    setAuthToken(token);
    setShowRegister(false);
    setShowOnboarding(false);
    // Store token for API calls
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const handleStartTrip = (tripData: any) => {
    setPendingTripData(tripData);
    setShowVehicleVerification(true);
    setActiveTab('journey');
  };

  const handleVehicleVerified = (plateNumber: string, vehicleId: string) => {
    const tripWithVehicle = { ...pendingTripData, plateNumber, vehicleId };
    setActiveTrip(tripWithVehicle);
    setIsJourneyMonitoring(true);
    setShowVehicleVerification(false);
  };

  const handleSkipVehicle = () => {
    setActiveTrip(pendingTripData);
    setIsJourneyMonitoring(true);
    setShowVehicleVerification(false);
  };

  const startLiveLocationSharing = (emergencyId: string) => {
    if (liveLocationIntervalRef.current) clearInterval(liveLocationIntervalRef.current);

    const sendUpdate = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          sendEmergencyLocationUpdate(
            emergencyId,
            pos.coords.latitude,
            pos.coords.longitude,
            pos.coords.accuracy,
            pos.coords.speed ?? undefined
          );
        },
        () => console.warn('[SOS] Geolocation unavailable')
      );
    };

    sendUpdate(); // immediate first update
    liveLocationIntervalRef.current = setInterval(sendUpdate, 10000); // every 10s
  };

  const stopLiveLocationSharing = () => {
    if (liveLocationIntervalRef.current) {
      clearInterval(liveLocationIntervalRef.current);
      liveLocationIntervalRef.current = null;
    }
  };

  const handleTriggerSOS = (method = 'discreet_button') => {
    setShowSOSCountdown(false);
    setIsSOSActive(true);
    setActiveTab('journey');
    if (!isJourneyMonitoring) setIsJourneyMonitoring(true);

    const sourceLat = activeTrip?.source?.lat || 18.5284;
    const sourceLng = activeTrip?.source?.lng || 73.8739;
    const destName = activeTrip?.destination?.name || '';

    // Only create the emergency session — no SMS, no live location yet
    axios.post('http://localhost:5000/api/emergency/start', {
      userId: user?._id,
      userName: user?.name,
      userPhone: user?.phone,
      triggerType: 'MANUAL_SOS',
      currentLocation: { latitude: sourceLat, longitude: sourceLng },
      tripDestination: destName
    }).then((res) => {
      const emergencyId = res.data?.emergencyId || `EMG-LOCAL-${Date.now()}`;
      setActiveEmergencyId(emergencyId);
    }).catch(() => {
      setActiveEmergencyId(`EMG-LOCAL-${Date.now()}`);
    });
  };

  if (showOnboarding) {
    return (
      <div className="mobile-wrapper">
        <OnboardingScreen onComplete={() => setShowOnboarding(false)} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mobile-wrapper">
        {showRegister ? (
          <RegisterScreen
            onRegisterSuccess={handleLoginSuccess}
            onSwitchToLogin={() => setShowRegister(false)}
          />
        ) : (
          <LoginScreen
            onLoginSuccess={handleLoginSuccess}
            onSwitchToRegister={() => setShowRegister(true)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="mobile-wrapper">
      {/* Top Header */}
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={26} color="#2563eb" />
          <div className="header-user">
            <h2>JourneyGuard</h2>
            <p><span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#16a34a', display: 'inline-block' }} /> Protection Active</p>
          </div>
        </div>

        {isSOSActive ? (
          <span
            className="badge-pill badge-red"
            style={{ animation: 'pulse 1s infinite', cursor: 'pointer' }}
            onClick={() => { setIsSOSActive(false); stopLiveLocationSharing(); setActiveEmergencyId(null); }}
            title="Tap to resolve emergency"
          >
            EMERGENCY ACTIVE
          </span>
        ) : (
          <button
            onClick={() => setShowHandsFreeModal(true)}
            style={{
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              border: '1px solid #bfdbfe',
              borderRadius: '9999px',
              padding: '0.35rem 0.75rem',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Hands-Free SOS
          </button>
        )}
      </header>

      {/* Screen Body */}
      <main className="screen-body">
        {activeTab === 'home' && (
          <HomeScreen
            user={user}
            contactsCount={2}
            onStartJourneyClick={() => setActiveTab('journey')}
            onViewContactsClick={() => setActiveTab('contacts')}
            onViewIncidentsClick={() => setActiveTab('incidents')}
            onOpenDemoMode={() => setActiveTab('journey')}
          />
        )}

        {activeTab === 'journey' && (
          isJourneyMonitoring ? (
            <LiveJourneyScreen
              tripData={activeTrip}
              user={user}
              onTriggerSOS={() => setShowSOSCountdown(true)}
              onShareLocation={() => activeEmergencyId && startLiveLocationSharing(activeEmergencyId)}
              onEndJourney={() => {
                stopLiveLocationSharing();
                setIsJourneyMonitoring(false);
                setActiveTrip(null);
                setShowVehicleVerification(false);
                setActiveTab('home');
              }}
            />
          ) : showVehicleVerification ? (
            <VehicleVerificationScreen
              onVerified={handleVehicleVerified}
              onSkip={handleSkipVehicle}
            />
          ) : (
            <StartJourneyScreen onStartMonitoring={handleStartTrip} />
          )
        )}

        {activeTab === 'contacts' && <TrustedContactsScreen />}
        {activeTab === 'incidents' && <IncidentHistoryScreen />}
        {activeTab === 'safe_locations' && <SafeLocationsScreen />}
        {activeTab === 'profile' && (
          <ProfileSettingsScreen
            user={user}
            onLogout={() => setUser(null)}
            onOpenPrivacy={() => setActiveTab('privacy')}
            onOpenHandsFree={() => setShowHandsFreeModal(true)}
            onUserUpdate={(updatedUser) => setUser(updatedUser)}
          />
        )}
        {activeTab === 'privacy' && <PrivacyScreen onBack={() => setActiveTab('profile')} />}
      </main>

      {/* Floating Discreet SOS Button */}
      {!showSOSCountdown && (
        <button 
          className="discreet-sos-btn"
          onClick={() => setShowSOSCountdown(true)}
          title="Discreet Emergency SOS"
        >
          <AlertOctagon size={20} />
          SOS
        </button>
      )}

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <button className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
          <Home size={20} />
          Home
        </button>
        <button className={`nav-item ${activeTab === 'journey' ? 'active' : ''}`} onClick={() => setActiveTab('journey')}>
          <Navigation size={20} />
          Journey
        </button>
        <button className={`nav-item ${activeTab === 'contacts' ? 'active' : ''}`} onClick={() => setActiveTab('contacts')}>
          <Users size={20} />
          Contacts
        </button>
        <button className={`nav-item ${activeTab === 'incidents' ? 'active' : ''}`} onClick={() => setActiveTab('incidents')}>
          <Activity size={20} />
          Incidents
        </button>
        <button className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
          <User size={20} />
          Profile
        </button>
      </nav>

      {/* SOS Countdown Modal */}
      {showSOSCountdown && (
        <SOSCountdownModal
          onConfirm={() => handleTriggerSOS('discreet_button')}
          onCancel={() => setShowSOSCountdown(false)}
        />
      )}

      {/* Hands-Free Settings & Voice Trigger Modal */}
      {showHandsFreeModal && (
        <HandsFreeSOSModal
          onTriggerSOS={(method) => {
            setShowHandsFreeModal(false);
            handleTriggerSOS(method);
          }}
          onClose={() => setShowHandsFreeModal(false)}
        />
      )}
    </div>
  );
}

export default App;
