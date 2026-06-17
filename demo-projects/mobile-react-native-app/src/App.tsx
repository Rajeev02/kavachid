import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { createKavachMobileClient, SecureStoreModule } from '@kavachid/react-native';
import { KavachClient } from '@kavachid/sdk';

// 1. Mock secure keychain storage implementation for expo-secure-store/react-native-keychain
const storageMap = new Map<string, string>();
const mockKeychainStore: SecureStoreModule = {
  async getItemAsync(key: string) {
    return storageMap.get(key) || null;
  },
  async setItemAsync(key: string, value: string) {
    storageMap.set(key, value);
  },
  async deleteItemAsync(key: string) {
    storageMap.delete(key);
  }
};

// 2. Instantiate local DPoP-bound client for mobile
const client: KavachClient = createKavachMobileClient({
  serverUrl: 'http://localhost:3000',
  tenantId: '123e4567-e89b-12d3-a456-426614174000',
  secureStore: mockKeychainStore,
});

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial auth token
    client.getAccessToken().then(token => {
      setAuthenticated(!!token);
      setLoading(false);
    });
  }, []);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      await client.login(email, password, 'mobile-keychain-device');
      setAuthenticated(true);
      Alert.alert('Success', 'Logged in successfully with DPoP-bound mobile session!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await client.logout();
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchData = async () => {
    try {
      // Fetch sensitive backend resource
      const res = await client.authenticatedFetch('http://localhost:3001/resource/public-info');
      const data = await res.json();
      Alert.alert('Protected Data Response', JSON.stringify(data, null, 2));
    } catch (err: any) {
      Alert.alert('API Error', err.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🛡️ KavachID Mobile</Text>
      <Text style={styles.subtitle}>React Native Client App</Text>

      {!authenticated ? (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="#94a3b8"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#94a3b8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.btnText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.form}>
          <Text style={styles.infoText}>Logged in using local Secure Store Keychain binding.</Text>
          <TouchableOpacity style={[styles.button, styles.btnSec]} onPress={handleFetchData}>
            <Text style={styles.btnTextSec}>📡 Call Secure API (with DPoP)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.btnDanger]} onPress={handleLogout}>
            <Text style={styles.btnTextDanger}>Logout</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 40,
  },
  form: {
    width: '100%',
    maxWidth: 320,
  },
  input: {
    width: '100%',
    height: 48,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    paddingHorizontal: 16,
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    width: '100%',
    height: 48,
    backgroundColor: '#6366f1',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  btnSec: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  btnTextSec: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },
  btnDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  btnTextDanger: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoText: {
    color: '#94a3b8',
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 24,
  }
});
