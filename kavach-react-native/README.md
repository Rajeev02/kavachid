# @kavachid/react-native 📱

**React Native Secure Storage Adapter** for KavachID - next-generation, DPoP-bound, multi-tenant Identity & Access Management.

`@kavachid/react-native` bridges the core `@kavachid/sdk` client storage to native mobile keychains (such as `expo-secure-store` or `react-native-keychain`). This guarantees that session tokens and ephemeral DPoP private keys are cryptographically locked inside hardware secure keystores (Secure Enclave / Android StrongBox).

---

## 🚀 Why Use KavachID React Native?

* **Hardware-Backed Key Storage:** Automatically routes DPoP cryptographic keys and refresh tokens to Android Keystore and iOS Keychain.
* **Bridge Compatibility:** Supports both the legacy React Native bridge and the New Architecture (TurboModules).
* **Zero-Trust Client Integration:** Seamlessly signs all outgoing mobile requests with unique DPoP headers.

---

## 📦 Installation
Requires `@kavachid/sdk` as a peer dependency:
```bash
npm install @kavachid/sdk @kavachid/react-native
```

---

## 🏃 Quick Start

### 1. Initialize Mobile Client
Integrate your secure storage module (e.g., `expo-secure-store` or `react-native-keychain` wrapper) to initialize the mobile client:

```typescript
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Button, Alert } from 'react-native';
import { createKavachMobileClient, SecureStoreModule } from '@kavachid/react-native';
import { KavachClient } from '@kavachid/sdk';

// 1. Wrap your native storage module to satisfy SecureStoreModule
const mySecureStorage: SecureStoreModule = {
  async getItemAsync(key: string) {
    // Return from expo-secure-store / react-native-keychain
    return MySecureStore.getItem(key);
  },
  async setItemAsync(key: string, value: string) {
    await MySecureStore.setItem(key, value);
  },
  async deleteItemAsync(key: string) {
    await MySecureStore.deleteItem(key);
  }
};

// 2. Instantiate local mobile client
const client: KavachClient = createKavachMobileClient({
  serverUrl: 'https://api.kavachid.local',
  tenantId: 'your-tenant-uuid',
  secureStore: mySecureStorage,
});
```

### 2. Login & Sign Out Flows
```typescript
export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      // Login automatically signs credentials request with DPoP keypair
      await client.login(email, password, 'ios-device');
      Alert.alert('Authenticated!');
    } catch (err: any) {
      Alert.alert('Failed: ' + err.message);
    }
  };

  const handleFetchData = async () => {
    // Signs the request header dynamically using Keychain-backed keys
    const res = await client.authenticatedFetch('/auth/sessions');
    const data = await res.json();
    console.log(data);
  };

  return (
    <View style={styles.container}>
      <TextInput value={email} onChangeText={setEmail} placeholder="Email" />
      <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Password" />
      <Button title="Login" onPress={handleLogin} />
      <Button title="Fetch Sessions" onPress={handleFetchData} />
    </View>
  );
}
```

---

## 🛠️ Supported Platforms & Minimum Versions

* **React Native Version:** Compatible with React Native 0.70.0+ (supports legacy and New Architecture/TurboModule configurations).
* **Supported OS:** iOS 13.0+ and Android 6.0+ (API Level 23+).
* **Typings:** Includes full TypeScript definitions out of the box.
