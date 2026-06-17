# @kavachid/react ⚛️

**React Context Provider and Hooks** for KavachID - next-generation, DPoP-bound, multi-tenant Identity & Access Management.

`@kavachid/react` wraps the core `@kavachid/sdk` client into React-friendly hooks and context providers, enabling you to build secure React SPAs, Vite, and Next.js applications in minutes.

---

## 🚀 Why Use KavachID React?

* **Declarative Auth State:** Get instant loading, authenticated status, and error structures globally.
* **Easy Hook Integrations:** Access sessions, credentials, and tokens directly via a unified hook (`useKavach()`).
* **Zero-Setup Context:** Handles browser-native DPoP session storage and refreshes automatically inside React lifecycle loops.

---

## 📦 Installation
Requires `@kavachid/sdk` as a peer dependency:
```bash
npm install @kavachid/sdk @kavachid/react
```

---

## 🏃 Quick Start

### 1. Wrap Your Application Root
Wrap your main application in the `<KavachProvider>` component:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { KavachProvider } from '@kavachid/react';

const config = {
  serverUrl: 'https://api.kavachid.local',
  tenantId: 'your-tenant-uuid-here',
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <KavachProvider options={config}>
      <App />
    </KavachProvider>
  </React.StrictMode>
);
```

### 2. Access Auth State & Methods in Components
Use the `useKavach` hook in any child component:

```tsx
import React, { useState } from 'react';
import { useKavach } from '@kavachid/react';

export default function Dashboard() {
  const { isAuthenticated, isLoading, user, error, login, logout, client } = useKavach();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (isLoading) return <div>Checking session...</div>;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  const handleCallSecureAPI = async () => {
    if (!client) return;
    const res = await client.authenticatedFetch('/auth/sessions');
    const data = await res.json();
    console.log('Secure data:', data);
  };

  return (
    <div>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!isAuthenticated ? (
        <form onSubmit={handleLogin}>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit">Sign In</button>
        </form>
      ) : (
        <div>
          <p>Welcome, {user.email}!</p>
          <button onClick={handleCallSecureAPI}>Fetch Active Devices</button>
          <button onClick={logout}>Log Out</button>
        </div>
      )}
    </div>
  );
}
```

---

## 🛠️ Supported Platforms & Minimum Versions

* **React Version:** Compatible with React 18.0.0+ and React 19.0.0+.
* **Module Systems:** Supports ESM and CJS bundlers (Vite, Next.js client components, Webpack).
