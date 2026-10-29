import seedUsers from '../data/users.json';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
}

const STORAGE_KEY = 'journeyguard_users';

/** Seed localStorage from users.json on first load */
function ensureSeeded(): void {
  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedUsers));
  }
}

export function getAllUsers(): User[] {
  ensureSeeded();
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as User[];
  } catch {
    return [];
  }
}

function saveAllUsers(users: User[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

export function getUserByEmail(email: string): User | undefined {
  return getAllUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
}

/** Returns user WITHOUT password on success, null on failure */
export function loginUser(email: string, password: string): Omit<User, 'password'> | null {
  const user = getUserByEmail(email);
  if (!user || user.password !== password) return null;
  const { password: _pw, ...safeUser } = user;
  return safeUser;
}

export function registerUser(
  name: string,
  email: string,
  phone: string,
  password: string
): { success: boolean; user?: Omit<User, 'password'>; error?: string } {
  const existing = getUserByEmail(email);
  if (existing) {
    return { success: false, error: 'An account with this email already exists.' };
  }

  const users = getAllUsers();
  const newUser: User = {
    id: `user_${Date.now()}`,
    name,
    email,
    phone,
    password,
  };
  users.push(newUser);
  saveAllUsers(users);

  const { password: _pw, ...safeUser } = newUser;
  return { success: true, user: safeUser };
}

export function updateUser(
  id: string,
  updates: Partial<User>
): { success: boolean; user?: Omit<User, 'password'>; error?: string } {
  const users = getAllUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) {
    return { success: false, error: 'User not found.' };
  }

  // If email is changing, ensure no conflict
  if (updates.email && updates.email.toLowerCase() !== users[idx].email.toLowerCase()) {
    const conflict = users.find(
      (u) => u.id !== id && u.email.toLowerCase() === updates.email!.toLowerCase()
    );
    if (conflict) {
      return { success: false, error: 'That email is already taken by another account.' };
    }
  }

  users[idx] = { ...users[idx], ...updates };
  saveAllUsers(users);

  const { password: _pw, ...safeUser } = users[idx];
  return { success: true, user: safeUser };
}
