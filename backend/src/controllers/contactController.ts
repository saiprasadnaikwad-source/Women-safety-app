import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { dbStore, ITrustedContact } from '../models/db';

export async function getContacts(req: AuthRequest, res: Response) {
  const userId = req.user?.userId || 'user_demo_101';
  const contacts = Array.from(dbStore.contacts.values()).filter(c => c.userId === userId);
  res.json(contacts);
}

export async function addContact(req: AuthRequest, res: Response) {
  const userId = req.user?.userId || 'user_demo_101';
  const { name, phone, relationship, isPrimary } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ message: 'Name and phone number are required' });
  }

  // If marked primary, unmark others
  if (isPrimary) {
    for (const c of dbStore.contacts.values()) {
      if (c.userId === userId) c.isPrimary = false;
    }
  }

  const contactId = `contact_${Date.now()}`;
  const newContact: ITrustedContact = {
    _id: contactId,
    userId,
    name,
    phone,
    relationship: relationship || 'Friend',
    isPrimary: isPrimary ?? (dbStore.contacts.size === 0),
    createdAt: new Date()
  };

  dbStore.contacts.set(contactId, newContact);
  res.status(201).json(newContact);
}

export async function updateContact(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const contact = dbStore.contacts.get(id);
  if (!contact) return res.status(404).json({ message: 'Contact not found' });

  const { name, phone, relationship, isPrimary } = req.body;
  if (name) contact.name = name;
  if (phone) contact.phone = phone;
  if (relationship) contact.relationship = relationship;
  
  if (isPrimary !== undefined) {
    if (isPrimary) {
      for (const c of dbStore.contacts.values()) {
        if (c.userId === contact.userId) c.isPrimary = false;
      }
    }
    contact.isPrimary = isPrimary;
  }

  dbStore.contacts.set(id, contact);
  res.json(contact);
}

export async function deleteContact(req: AuthRequest, res: Response) {
  const { id } = req.params;
  if (!dbStore.contacts.has(id)) {
    return res.status(404).json({ message: 'Contact not found' });
  }
  dbStore.contacts.delete(id);
  res.json({ message: 'Contact removed successfully' });
}
