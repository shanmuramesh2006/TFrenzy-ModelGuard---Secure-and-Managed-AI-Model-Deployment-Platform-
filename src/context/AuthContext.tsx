import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AUTH_CREDENTIALS_KEY = 'tfrenzy_auth_credentials';
const AUTH_SESSION_KEY = 'tfrenzy_user_session';

interface StoredCredentials {
  email: string;
  passwordHash: string;
}

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);

  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  return Array.from(new Uint8Array(hashBuffer))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isStrongPassword(password: string): boolean {
  return (
    password.length >= 12 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

function getUserName(email: string, role: UserRole): string {
  const defaultNames: Record<string, string> = {
    'admin@tfrenzy.io': 'Alex Vance (Platform Admin)',
    'auditor@tfrenzy.io': 'Dr. Elena Rostova (Security Auditor)',
    'operator@tfrenzy.io': 'Marcus Chen (Edge Operator)',
    'device-cert@tfrenzy.io': 'Hardware Certificate User'
  };

  const existingName = defaultNames[email];
  if (existingName) {
    return existingName;
  }

  const roleTitles: Record<UserRole, string> = {
    admin: 'Platform Admin',
    security_auditor: 'Security Auditor',
    field_operator: 'Edge Operator'
  };

  const username = email.split('@')[0] || 'User';

  const formattedName = username
    .split(/[._\-+]/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

  return `${formattedName} (${roleTitles[role]})`;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(AUTH_SESSION_KEY);

    if (!saved) {
      return null;
    }

    try {
      return JSON.parse(saved) as User;
    } catch {
      localStorage.removeItem(AUTH_SESSION_KEY);
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_SESSION_KEY);
    }
  }, [user]);

  const login = async (
    email: string,
    password: string,
    role: UserRole
  ): Promise<boolean> => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return false;
    }

    if (!isValidEmail(normalizedEmail)) {
      return false;
    }

    const savedCredentials = localStorage.getItem(AUTH_CREDENTIALS_KEY);

    // First login = create the single permanent credential pair.
    if (!savedCredentials) {
      if (!isStrongPassword(password)) {
        return false;
      }

      const passwordHash = await hashPassword(password);

      const credentials: StoredCredentials = {
        email: normalizedEmail,
        passwordHash
      };

      localStorage.setItem(
        AUTH_CREDENTIALS_KEY,
        JSON.stringify(credentials)
      );
    } else {
      let credentials: StoredCredentials;

      try {
        credentials = JSON.parse(savedCredentials) as StoredCredentials;
      } catch {
        localStorage.removeItem(AUTH_CREDENTIALS_KEY);
        return false;
      }

      const passwordHash = await hashPassword(password);

      if (
        normalizedEmail !== credentials.email ||
        passwordHash !== credentials.passwordHash
      ) {
        return false;
      }
    }

    const newUser: User = {
      id: `USR-${role.toUpperCase()}-001`,
      name: getUserName(normalizedEmail, role),
      email: normalizedEmail,
      role,
      avatar: DEFAULT_AVATAR,
      mfaEnabled: true,
      lastLogin: new Date().toISOString()
    };

    setUser(newUser);
    return true;
  };

  const logout = () => {
    setUser(null);
  };

  const switchRole = (role: UserRole) => {
    if (!user) return;

    setUser(prev =>
      prev
        ? {
            ...prev,
            role,
            name: getUserName(prev.email, role),
            lastLogin: new Date().toISOString()
          }
        : null
    );
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        switchRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
