import { KavachClient, StorageProvider } from '@kavachid/sdk';

/**
 * Interface representing a mobile Secure Store adapter (e.g. Expo SecureStore or react-native-keychain)
 */
export interface SecureStoreModule {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
}

/**
 * StorageProvider implementation using React Native Secure Store module
 */
export class MobileSecureStorageProvider implements StorageProvider {
  constructor(private readonly secureStore: SecureStoreModule) {}

  async getItem(key: string): Promise<string | null> {
    return this.secureStore.getItemAsync(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    await this.secureStore.setItemAsync(key, value);
  }

  async removeItem(key: string): Promise<void> {
    await this.secureStore.deleteItemAsync(key);
  }
}

export interface KavachMobileOptions {
  serverUrl: string;
  tenantId: string;
  secureStore: SecureStoreModule;
}

/**
 * Creates a KavachClient pre-configured for React Native secure keychain storage
 */
export function createKavachMobileClient(options: KavachMobileOptions): KavachClient {
  const secureStorage = new MobileSecureStorageProvider(options.secureStore);
  return new KavachClient({
    serverUrl: options.serverUrl,
    tenantId: options.tenantId,
    storage: secureStorage,
  });
}
