import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { KavachProvider } from '@kavachid/react';

const options = {
  serverUrl: 'http://localhost:3000',
  tenantId: '123e4567-e89b-12d3-a456-426614174000',
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <KavachProvider options={options}>
      <App />
    </KavachProvider>
  </React.StrictMode>
);
