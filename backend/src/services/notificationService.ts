import { dbStore } from '../models/db';

function buildEmergencyMessage(userName: string, userPhone: string, lat: number, lng: number, activationMethod: string, tripDestination: string) {
  const googleMapLink = `https://maps.google.com/?q=${lat},${lng}`;
  const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  return (
    `🚨 EMERGENCY ALERT 🚨\n` +
    `${userName} needs URGENT help!\n` +
    `Time: ${time}\n` +
    `Live Location: ${googleMapLink}\n` +
    `Destination: ${tripDestination || 'In Transit'}\n` +
    `Triggered via: ${activationMethod || 'SOS Button'}\n` +
    `Phone: ${userPhone}\n` +
    `Please respond immediately or call 112.`
  );
}

export async function sendEmergencyAlertToContacts(
  userId: string,
  alertDetails: {
    lat: number;
    lng: number;
    activationMethod?: string;
    tripDestination?: string;
    riskScore?: number;
    userName?: string;
  }
) {
  const user = dbStore.users.get(userId);
  const userName = alertDetails.userName || user?.name || 'A JourneyGuard user';
  const userPhone = user?.phone || 'Unknown';
  const userContacts = Array.from(dbStore.contacts.values()).filter(c => c.userId === userId);

  if (userContacts.length === 0) {
    console.warn(`[NOTIFICATION] No contacts found for userId: ${userId}`);
    return { success: false, contactsNotified: 0, totalContacts: 0, messageSent: '', contacts: [] };
  }

  const message = buildEmergencyMessage(userName, userPhone, alertDetails.lat, alertDetails.lng, alertDetails.activationMethod || 'SOS Button', alertDetails.tripDestination || 'In Transit');

  console.log(`\n[NOTIFICATION] Emergency SOS for ${userName} — SMS will be sent via mobile to ${userContacts.length} contacts`);
  console.log(`[NOTIFICATION] Message:\n${message}\n`);

  return {
    success: true,
    contactsNotified: userContacts.length,
    totalContacts: userContacts.length,
    messageSent: message,
    contacts: userContacts.map(c => ({ name: c.name, phone: c.phone }))
  };
}

export async function sendLiveLocationShareToContacts(
  userId: string,
  lat: number,
  lng: number,
  emergencyId: string
) {
  const user = dbStore.users.get(userId);
  const userName = user?.name || 'JourneyGuard User';
  const userContacts = Array.from(dbStore.contacts.values()).filter(c => c.userId === userId);

  const googleMapLink = `https://maps.google.com/?q=${lat},${lng}`;
  const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const message =
    `📍 LIVE LOCATION UPDATE\n` +
    `${userName} is sharing live location.\n` +
    `Emergency ID: ${emergencyId}\n` +
    `Time: ${time}\n` +
    `Current Location: ${googleMapLink}\n` +
    `Stay alert and keep your phone available.`;

  if (userContacts.length === 0) {
    console.warn(`[LOCATION SHARE] No contacts for userId: ${userId}`);
    return { success: false, contactsNotified: 0, contacts: [], message };
  }

  console.log(`[LOCATION SHARE] SMS will be sent via mobile to ${userContacts.length} contacts for userId: ${userId}`);

  return {
    success: true,
    contactsNotified: userContacts.length,
    contacts: userContacts.map(c => ({ name: c.name, phone: c.phone })),
    message
  };
}

export async function sendJourneyStartedSMS(userId: string, userName: string, sourceName: string, destinationName: string, lat: number, lng: number, etaMinutes: number, tripId: string) {
  const userContacts = Array.from(dbStore.contacts.values()).filter(c => c.userId === userId);
  const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;
  const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const message =
    `🚌 JOURNEY STARTED\n${userName} has started a journey.\nFrom: ${sourceName}\nTo: ${destinationName}\nTime: ${time}\nETA: ~${etaMinutes} mins\nStart Location: ${mapsLink}`;
  console.log(`[JOURNEY SMS] Journey start — SMS via mobile to ${userContacts.length} contacts`);
  return { contacts: userContacts.map(c => ({ name: c.name, phone: c.phone })), message };
}

export async function sendJourneyEndedSMS(userId: string, userName: string, destinationName: string, lat: number, lng: number) {
  const userContacts = Array.from(dbStore.contacts.values()).filter(c => c.userId === userId);
  const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;
  const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const message =
    `✅ JOURNEY COMPLETED\n${userName} has reached ${destinationName} safely.\nTime: ${time}\nFinal Location: ${mapsLink}`;
  console.log(`[JOURNEY SMS] Journey end — SMS via mobile to ${userContacts.length} contacts`);
  return { contacts: userContacts.map(c => ({ name: c.name, phone: c.phone })), message };
}

export async function sendResolvedAlertToContacts(userId: string, emergencyId: string, lat: number, lng: number, durationMins: number, resolvedBy: string) {
  const user = dbStore.users.get(userId);
  const userName = user?.name || 'JourneyGuard User';
  const userContacts = Array.from(dbStore.contacts.values()).filter(c => c.userId === userId);
  const googleMapLink = `https://maps.google.com/?q=${lat},${lng}`;
  const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const message =
    `✅ EMERGENCY RESOLVED\n${userName} is now SAFE.\nEmergency ID: ${emergencyId}\nResolved by: ${resolvedBy}\nTime: ${time}\nDuration: ${durationMins} min\nLast Location: ${googleMapLink}`;
  console.log(`[NOTIFICATION] Resolved — SMS via mobile to ${userContacts.length} contacts`);
  return { contacts: userContacts.map(c => ({ name: c.name, phone: c.phone })), message };
}
