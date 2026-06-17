import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { KavachClient, StorageProvider } from '@kavachid/sdk';

export interface KavachReactOptions {
  serverUrl: string;
  tenantId: string;
  storage?: StorageProvider;
}

export interface KavachContextType {
  client: KavachClient | null;
  user: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (identifier: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  register: (email?: string, password?: string, username?: string, metadata?: any) => Promise<any>;
  authenticatedFetch: (path: string, init?: RequestInit) => Promise<Response>;
}

const KavachContext = createContext<KavachContextType | null>(null);

export const KavachProvider = ({ 
  children, 
  options 
}: { 
  children: ReactNode; 
  options: KavachReactOptions;
}) => {
  const [client, setClient] = useState<KavachClient | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const kavachClient = new KavachClient({
        serverUrl: options.serverUrl,
        tenantId: options.tenantId,
        storage: options.storage
      });
      setClient(kavachClient);

      // Check if access token is in storage
      kavachClient.getAccessToken().then((token) => {
        if (token) {
          // Simple user mock resolver
          setUser({ email: 'authenticated-user' });
        }
        setIsLoading(false);
      });
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  }, [options.serverUrl, options.tenantId, options.storage]);

  const login = async (identifier: string, password: string) => {
    if (!client) throw new Error('KavachClient not initialized');
    setError(null);
    try {
      const res = await client.login(identifier, password);
      setUser(res.user || { email: identifier });
      return res;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    if (!client) return;
    try {
      await client.logout();
    } finally {
      setUser(null);
    }
  };

  const register = async (email?: string, password?: string, username?: string, metadata?: any) => {
    if (!client) throw new Error('KavachClient not initialized');
    return client.register(email, password, username, metadata);
  };

  const authenticatedFetch = async (path: string, init?: RequestInit) => {
    if (!client) throw new Error('KavachClient not initialized');
    return client.authenticatedFetch(path, init);
  };

  return (
    <KavachContext.Provider
      value={{
        client,
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        logout,
        register,
        authenticatedFetch
      }}
    >
      {children}
    </KavachContext.Provider>
  );
};

export const useKavach = () => {
  const context = useContext(KavachContext);
  if (!context) {
    throw new Error('useKavach must be used within a KavachProvider');
  }
  return context;
};
