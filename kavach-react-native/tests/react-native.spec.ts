import { MobileSecureStorageProvider, createKavachMobileClient, SecureStoreModule } from '../src/index';

describe('KavachID React Native SDK Suite', () => {
  let mockSecureStore: SecureStoreModule;

  beforeEach(() => {
    mockSecureStore = {
      getItemAsync: jest.fn().mockResolvedValue('stored-value'),
      setItemAsync: jest.fn().mockResolvedValue(undefined),
      deleteItemAsync: jest.fn().mockResolvedValue(undefined),
    };
  });

  describe('MobileSecureStorageProvider', () => {
    it('should retrieve items using the secure store adapter', async () => {
      const provider = new MobileSecureStorageProvider(mockSecureStore);
      const val = await provider.getItem('test-key');
      expect(val).toBe('stored-value');
      expect(mockSecureStore.getItemAsync).toHaveBeenCalledWith('test-key');
    });

    it('should set items using the secure store adapter', async () => {
      const provider = new MobileSecureStorageProvider(mockSecureStore);
      await provider.setItem('test-key', 'new-value');
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith('test-key', 'new-value');
    });

    it('should remove items using the secure store adapter', async () => {
      const provider = new MobileSecureStorageProvider(mockSecureStore);
      await provider.removeItem('test-key');
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('test-key');
    });
  });

  describe('createKavachMobileClient', () => {
    it('should create an instance of KavachClient configured with secure storage', async () => {
      const client = createKavachMobileClient({
        serverUrl: 'http://localhost:3000',
        tenantId: 'tenant-uuid',
        secureStore: mockSecureStore,
      });

      expect(client).toBeDefined();
      expect(client.clientId).toBeUndefined(); // defaults
      
      // Attempting to retrieve token should call secureStore.getItemAsync
      await client.getAccessToken();
      expect(mockSecureStore.getItemAsync).toHaveBeenCalledWith('kavach_access_token');
    });
  });
});
