import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { apiClient } from '../api/client';
import type { Lawyer } from '../types/contracts';

interface AuthContextValue {
  currentLawyer: Lawyer | null;
  isLoading: boolean;
  quickDemoLogin: (lawyerId: 'lawyer-1' | 'lawyer-2') => Promise<Lawyer>;
  loginWithEmail: (email: string, password: string) => Promise<Lawyer>;
  registerLawyer: (name: string, email: string, password: string) => Promise<Lawyer>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentLawyer, setCurrentLawyer] = useState<Lawyer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void apiClient.getCurrentLawyer().then((lawyer) => {
      setCurrentLawyer(lawyer);
      setIsLoading(false);
    });
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    currentLawyer,
    isLoading,
    quickDemoLogin: async (lawyerId) => {
      const lawyer = await apiClient.quickDemoLogin(lawyerId);
      setCurrentLawyer(lawyer);
      return lawyer;
    },
    loginWithEmail: async (email, password) => {
      const lawyer = await apiClient.loginWithEmail(email, password);
      setCurrentLawyer(lawyer);
      return lawyer;
    },
    registerLawyer: async (name, email, password) => {
      const lawyer = await apiClient.registerLawyer(name, email, password);
      setCurrentLawyer(lawyer);
      return lawyer;
    },
    logout: async () => {
      await apiClient.logout();
      setCurrentLawyer(null);
    },
  }), [currentLawyer, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return context;
}
