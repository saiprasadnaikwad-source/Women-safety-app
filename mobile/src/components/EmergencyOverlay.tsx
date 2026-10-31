import React, { useState } from 'react';
import { ShieldAlert, Navigation, Phone, Share2, X, MapPin } from 'lucide-react';
import axios from 'axios';
import { EmergencySessionData } from '../services/emergencyService';
import { getApiBaseUrl } from '../services/apiConfig';

interface EmergencyContact {
  name: string;
  phone: string;
}

interface EmergencyOverlayProps {
  session: EmergencySessionData | null;
  onResolve: () => void;
  onChangeCategory?: (category: string) => void;
  onNavigate?: () => void;
  tripDestination?: { name: string; lat: number; lng: number };
  vehiclePlate?: string;
  onShareLocation?: () => void;
}

export const EmergencyOverlay: React.FC<EmergencyOverlayProps> = ({
  session,
  onResolve,
  onChangeCategory,
  onNavigate,
  tripDestination,
  vehiclePlate,
  onShareLocation
}) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCallConfirmModal, setShowCallConfirmModal] = useState(false);
  const [shareContacts, setShareContacts] = useState<EmergencyContact[]>([]);
  const [shareMessage, setShareMessage] = useState('');
  const [shareError, setShareError] = useState('');
  const [callContact, setCallContact] = useState<EmergencyContact | null>(null);
  const [callContactError, setCallContactError] = useState('');
  const [loadingCallContact, setLoadingCallContact] = useState(false);

  if (!session || session.emergencyStatus === 'RESOLVED') return null;

  const safeLoc = session.safeLocation;
  const isPolice = safeLoc.category === 'Police Station';

  const handleShareLink = async () => {
    const lat = session.currentLocation.latitude;
    const lng = session.currentLocation.longitude;
    const googleMapLink = `https://maps.google.com/?q=${lat},${lng}`;
    const directionsLink = tripDestination
      ? `https://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination=${tripDestination.lat},${tripDestination.lng}`
      : null;
    const vehiclePlateText = vehiclePlate ? `\n🚗 Vehicle Number Plate: ${vehiclePlate}` : '';

    let contacts: EmergencyContact[] = [];
    let message =
      `🚨 EMERGENCY ALERT\n` +
      `${session.userName || 'User'} needs help!\n` +
      `📍 Live Location: ${googleMapLink}\n` +
      vehiclePlateText +
      (tripDestination ? `🏁 Destination: ${tripDestination.name}\n` : '') +
      (directionsLink ? `🗺️ Route: ${directionsLink}\n` : '') +
      `Emergency ID: ${session.emergencyId}\nPlease respond immediately or call 112.`;

    try {
      const res = await axios.post(`${getApiBaseUrl()}/api/emergency/share-location`, {
        emergencyId: session.emergencyId,
        userId: session.userId,
        latitude: lat,
        longitude: lng
      });
      contacts = res.data.smsContacts || [];
      message = res.data.smsMessage
        ? res.data.smsMessage +
          vehiclePlateText +
          (tripDestination ? `\n🏁 Destination: ${tripDestination.name}` : '') +
          (directionsLink ? `\n🗺️ Route: ${directionsLink}` : '')
        : message;
    } catch {
      console.warn('[SHARE] Could not load the prepared location message; using a local message.');
      try {
        const res = await axios.get(`${getApiBaseUrl()}/api/contacts`);
        contacts = res.data || [];
      } catch (error) {
        console.error('[SHARE] Failed to load trusted contacts.', error);
        setShareContacts([]);
        setShareMessage('');
        setShareError('Could not load trusted contacts. Check that the backend is running and try again.');
        setShowShareModal(true);
        return;
      }
    }

    setShareContacts(contacts);
    setShareMessage(message);
    setShareError(contacts.length === 0 ? 'No trusted contacts are available to message.' : '');
    setShowShareModal(true);
  };

  const handleSendLocationSms = (contact: EmergencyContact) => {
    const phone = contact.phone.replace(/[^\d+]/g, '');
    if (!/^\+?\d{7,15}$/.test(phone)) {
      setShareError(`The saved phone number for ${contact.name} is invalid.`);
      return;
    }

    window.location.href = `sms:${phone}?body=${encodeURIComponent(shareMessage)}`;
    setShowShareModal(false);
    if (onShareLocation) onShareLocation();
  };

  const handleCallPolice = () => {
    setCallContactError('');
    setShowCallConfirmModal(true);
    setLoadingCallContact(false);

    const policePhone = isPolice && safeLoc.phone ? safeLoc.phone.split('/')[0].trim() : '112';
    const policeName = isPolice && safeLoc.name ? safeLoc.name : 'Police Emergency Helpline';

    setCallContact({ name: policeName, phone: policePhone });
  };

  const executeCall = () => {
    setShowCallConfirmModal(false);
    const phoneToCall = callContact?.phone || '112';
    window.location.href = `tel:${phoneToCall}`;
  };


  const handleOpenExternalNavigation = () => {
    const origin = `${session.currentLocation.latitude},${session.currentLocation.longitude}`;
    const destination = `${safeLoc.latitude},${safeLoc.longitude}`;
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
    window.open(mapsUrl, '_blank');
    if (onNavigate) onNavigate();
  };

  return (
    <div 
      style={{
        backgroundColor: '#ffffff',
        borderBottom: '2px solid #ef4444',
        boxShadow: '0 4px 20px rgba(220,38,38,0.2)',
        overflow: 'hidden',
        flexShrink: 0
      }}
    >
      {/* Top Emergency Active Header */}
      <div 
        style={{
          backgroundColor: '#dc2626',
          color: '#ffffff',
          padding: '0.65rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldAlert size={22} style={{ animation: 'pulse 1s infinite' }} />
          <div>
            <span style={{ fontWeight: 900, fontSize: '0.85rem', letterSpacing: '0.5px' }}>EMERGENCY MODE ACTIVE</span>
            <span style={{ fontSize: '0.7rem', display: 'block', opacity: 0.9 }}>ID: {session.emergencyId}</span>
          </div>
        </div>

        <button 
          onClick={onResolve}
          style={{
            backgroundColor: 'rgba(255,255,255,0.2)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '9999px',
            padding: '0.3rem 0.65rem',
            fontSize: '0.72rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.2rem'
          }}
        >
          <X size={14} /> Resolve
        </button>
      </div>

      {/* Main Safe Location Card Content */}
      <div style={{ padding: '1rem' }}>
        {/* Category Priority Tabs */}
        <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.75rem', overflowX: 'auto' }}>
          <button
            onClick={() => onChangeCategory && onChangeCategory('Police Station')}
            style={{
              backgroundColor: isPolice ? '#eff6ff' : '#f8fafc',
              color: isPolice ? '#1d4ed8' : '#64748b',
              border: `1px solid ${isPolice ? '#bfdbfe' : '#e2e8f0'}`,
              borderRadius: '9999px',
              padding: '0.3rem 0.65rem',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            🚔 Police Station (Primary)
          </button>
          <button
            onClick={() => onChangeCategory && onChangeCategory('Hospital')}
            style={{
              backgroundColor: safeLoc.category === 'Hospital' ? '#eff6ff' : '#f8fafc',
              color: safeLoc.category === 'Hospital' ? '#1d4ed8' : '#64748b',
              border: `1px solid ${safeLoc.category === 'Hospital' ? '#bfdbfe' : '#e2e8f0'}`,
              borderRadius: '9999px',
              padding: '0.3rem 0.65rem',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            🏥 Hospital
          </button>
          <button
            onClick={() => onChangeCategory && onChangeCategory('Fire Station')}
            style={{
              backgroundColor: safeLoc.category === 'Fire Station' ? '#eff6ff' : '#f8fafc',
              color: safeLoc.category === 'Fire Station' ? '#1d4ed8' : '#64748b',
              border: `1px solid ${safeLoc.category === 'Fire Station' ? '#bfdbfe' : '#e2e8f0'}`,
              borderRadius: '9999px',
              padding: '0.3rem 0.65rem',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            🚒 Fire Station
          </button>
        </div>

        {/* Selected Safe Location Highlight */}
        <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '0.85rem', marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
            <div>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase' }}>
                Recommended Emergency Location
              </span>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: '0.1rem 0' }}>
                {isPolice ? '🚔' : safeLoc.category === 'Hospital' ? '🏥' : '🏢'} {safeLoc.name}
              </h4>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#2563eb' }}>
                {session.routeDistanceKm} km
              </div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#16a34a' }}>
                ETA ~{session.estimatedDurationMinutes} min
              </div>
            </div>
          </div>

          <div style={{ fontSize: '0.75rem', color: '#475569', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <MapPin size={14} color="#64748b" /> {safeLoc.address}
          </div>

          {!isPolice && (
            <div style={{ fontSize: '0.7rem', color: '#d97706', backgroundColor: '#fef3c7', padding: '0.25rem 0.5rem', borderRadius: '6px', marginTop: '0.35rem' }}>
              ⚠️ Police station not found nearby — showing nearest verified emergency location.
            </div>
          )}

          <div style={{ fontSize: '0.7rem', color: '#64748b', fontStyle: 'italic', marginTop: '0.35rem' }}>
            "Nearest verified safe location automatically calculated from your current GPS position."
          </div>
        </div>

        {/* Live Sharing Status Pill */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '0.5rem 0.75rem', marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#16a34a', animation: 'pulse 1s infinite' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#15803d' }}>
              Live GPS Location Sharing Active
            </span>
          </div>
          <span style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 700 }}>
            Authority & Contacts Syncing
          </span>
        </div>

        {/* Action Buttons Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <button
            onClick={handleOpenExternalNavigation}
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              padding: '0.65rem 0.5rem',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem'
            }}
          >
            <Navigation size={16} /> Navigate There
          </button>

          <button
            onClick={handleShareLink}
            style={{
              backgroundColor: '#0f172a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              padding: '0.65rem 0.5rem',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem'
            }}
          >
            <Share2 size={16} /> Share Location
          </button>

          <button
            onClick={handleCallPolice}
            style={{
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              padding: '0.65rem 0.5rem',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              gridColumn: 'span 2'
            }}
          >
            <Phone size={16} /> Call Police (112)
          </button>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
              <Share2 size={24} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.35rem', color: '#1d4ed8' }}>Share location by SMS</h3>
            <p style={{ fontSize: '0.85rem', color: '#334155', marginBottom: '0.75rem' }}>
              Choose one trusted contact. The message will open separately in your SMS app; tap Send there.
            </p>
            <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '0.65rem', fontSize: '0.78rem', color: '#1e40af', marginBottom: '1rem' }}>
              📍 Google Maps link included<br />
              🆔 Emergency ID: {session.emergencyId}
            </div>
            {shareError && (
              <p role="alert" style={{ fontSize: '0.85rem', color: '#dc2626', marginBottom: '0.75rem' }}>
                {shareError}
              </p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
              {shareContacts.map((contact) => (
                <button
                  key={`${contact.name}-${contact.phone}`}
                  className="btn-large btn-secondary"
                  onClick={() => handleSendLocationSms(contact)}
                >
                  <Share2 size={16} /> Message {contact.name} ({contact.phone})
                </button>
              ))}
            </div>
            <button className="btn-large btn-primary" onClick={() => setShowShareModal(false)}>Close</button>
          </div>
        </div>
      )}

      {/* Call Confirmation Modal */}
      {showCallConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
              <Phone size={28} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.35rem' }}>Call Police Dispatch?</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
              This will open your phone dialer to connect directly to Police Emergency Services (112).
            </p>
            {callContact && (
              <p style={{ fontSize: '0.9rem', color: '#0f172a', marginBottom: '1.25rem' }}>
                Calling <strong>{callContact.name}</strong> ({callContact.phone})
              </p>
            )}
            {callContactError && (
              <p role="alert" style={{ fontSize: '0.85rem', color: '#dc2626', marginBottom: '1.25rem' }}>
                {callContactError}
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <button className="btn-large btn-danger" onClick={executeCall}>
                📞 Call Police (112)
              </button>
              <button className="btn-large btn-secondary" onClick={() => setShowCallConfirmModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
