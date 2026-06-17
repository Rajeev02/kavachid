import React from 'react';
import { render, act } from '@testing-library/react';
import { KavachProvider, useKavach } from '../src/index';
import { KavachClient } from '@kavachid/sdk';

// Mock the KavachClient
jest.mock('@kavachid/sdk', () => {
  return {
    KavachClient: jest.fn().mockImplementation(() => {
      return {
        getAccessToken: jest.fn().mockResolvedValue('mock-access-token'),
        login: jest.fn().mockResolvedValue({ user: { email: 'test@kavach.local' } }),
        logout: jest.fn().mockResolvedValue(undefined),
        register: jest.fn().mockResolvedValue({ success: true }),
        authenticatedFetch: jest.fn().mockResolvedValue({ ok: true }),
      };
    }),
  };
});

describe('KavachID React SDK Suite', () => {
  const options = {
    serverUrl: 'http://localhost:3000',
    tenantId: 'tenant-uuid',
  };

  it('should throw error when useKavach is used outside KavachProvider', () => {
    const TestComponent = () => {
      useKavach();
      return null;
    };

    // Suppress console.error log of React boundaries during testing
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => render(<TestComponent />)).toThrow(
      'useKavach must be used within a KavachProvider'
    );
    
    consoleErrorSpy.mockRestore();
  });

  it('should render children and provide context values', async () => {
    let contextValues: any = null;

    const TestComponent = () => {
      contextValues = useKavach();
      return <div>Test Child</div>;
    };

    await act(async () => {
      render(
        <KavachProvider options={options}>
          <TestComponent />
        </KavachProvider>
      );
    });

    expect(contextValues).not.toBeNull();
    expect(contextValues.isAuthenticated).toBe(true);
    expect(contextValues.client).toBeDefined();
  });

  it('should call login on client and update user status', async () => {
    let contextValues: any = null;

    const TestComponent = () => {
      contextValues = useKavach();
      return null;
    };

    await act(async () => {
      render(
        <KavachProvider options={options}>
          <TestComponent />
        </KavachProvider>
      );
    });

    const mockLogin = jest.spyOn(contextValues.client, 'login');

    await act(async () => {
      await contextValues.login('user@kavach.local', 'Pass123!');
    });

    expect(mockLogin).toHaveBeenCalledWith('user@kavach.local', 'Pass123!');
    expect(contextValues.user).toEqual({ email: 'test@kavach.local' });
    expect(contextValues.isAuthenticated).toBe(true);
  });

  it('should clear user state upon logout', async () => {
    let contextValues: any = null;

    const TestComponent = () => {
      contextValues = useKavach();
      return null;
    };

    await act(async () => {
      render(
        <KavachProvider options={options}>
          <TestComponent />
        </KavachProvider>
      );
    });

    // Make sure we have a user
    expect(contextValues.user).toBeDefined();

    await act(async () => {
      await contextValues.logout();
    });

    expect(contextValues.user).toBeNull();
    expect(contextValues.isAuthenticated).toBe(false);
  });
});
