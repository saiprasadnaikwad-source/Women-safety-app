import React, { useState, useEffect } from 'react';
import { Users, Plus, Phone, Trash2, Star, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { getApiBaseUrl } from '../services/apiConfig';

export const TrustedContactsScreen: React.FC = () => {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRel, setNewRel] = useState('Friend');
  const [saving, setSaving] = useState(false);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const baseUrl = getApiBaseUrl();
      const res = await axios.get(`${baseUrl}/api/contacts`);
      setContacts(res.data || []);
    } catch (err) {
      console.warn('[CONTACTS] Backend offline.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPhone) return;
    setSaving(true);
    try {
      const baseUrl = getApiBaseUrl();
      await axios.post(`${baseUrl}/api/contacts`, {
        name: newName,
        phone: newPhone,
        relationship: newRel,
        isPrimary: contacts.length === 0
      });
      setNewName('');
      setNewPhone('');
      setShowAddForm(false);
      await fetchContacts();
    } catch (err) {
      console.warn('[CONTACTS] Add failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const baseUrl = getApiBaseUrl();
      await axios.delete(`${baseUrl}/api/contacts/${id}`);
      setContacts(prev => prev.filter(c => c._id !== id));
    } catch (err) {
      console.warn('[CONTACTS] Delete failed.');
    }
  };

  const handleMakePrimary = async (id: string) => {
    try {
      const baseUrl = getApiBaseUrl();
      await axios.put(`${baseUrl}/api/contacts/${id}`, { isPrimary: true });
      await fetchContacts();
    } catch (err) {
      setContacts(prev => prev.map(c => ({ ...c, isPrimary: c._id === id })));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Trusted Contacts</h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Notified automatically during emergencies</p>
        </div>
        <button
          className="btn-large btn-primary"
          style={{ width: 'auto', padding: '0.5rem 0.85rem', fontSize: '0.82rem' }}
          onClick={() => setShowAddForm(true)}
        >
          <Plus size={16} /> Add
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAdd} className="card" style={{ border: '2px solid #2563eb' }}>
          <h3 className="card-title" style={{ fontSize: '0.95rem' }}>Add Emergency Contact</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}>
            <input
              type="text"
              placeholder="Full Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              style={{ padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
            />
            <input
              type="tel"
              placeholder="Phone (+91 98...)"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              required
              style={{ padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
            />
            <select
              value={newRel}
              onChange={(e) => setNewRel(e.target.value)}
              style={{ padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
            >
              {['Mother','Father','Sister','Brother','Friend','Spouse','Colleague'].map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn-large btn-primary" style={{ fontSize: '0.85rem' }} disabled={saving}>
                {saving ? 'Saving...' : 'Save Contact'}
              </button>
              <button type="button" className="btn-large btn-secondary" onClick={() => setShowAddForm(false)} style={{ fontSize: '0.85rem' }}>
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
          <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 0.5rem' }} />
          <p style={{ fontSize: '0.85rem' }}>Loading contacts...</p>
        </div>
      ) : contacts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
          <Users size={36} style={{ margin: '0 auto 0.75rem' }} />
          <p style={{ fontSize: '0.85rem' }}>No contacts yet. Add your first emergency contact.</p>
        </div>
      ) : (
        contacts.map((contact) => (
          <div key={contact._id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ backgroundColor: contact.isPrimary ? '#eff6ff' : '#f8fafc', color: contact.isPrimary ? '#2563eb' : '#64748b', padding: '0.65rem', borderRadius: '50%' }}>
                <Users size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  {contact.name}
                  {contact.isPrimary && <span className="badge-pill badge-green" style={{ fontSize: '0.65rem' }}>PRIMARY</span>}
                </div>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{contact.phone} • {contact.relationship}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              {!contact.isPrimary && (
                <button
                  onClick={() => handleMakePrimary(contact._id)}
                  title="Make Primary"
                  style={{ background: 'none', border: 'none', color: '#eab308', cursor: 'pointer', padding: '0.35rem' }}
                >
                  <Star size={18} />
                </button>
              )}
              <button
                onClick={() => handleDelete(contact._id)}
                title="Delete"
                style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '0.35rem' }}
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};
