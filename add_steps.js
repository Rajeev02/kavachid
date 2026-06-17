const fs = require('fs');

const frontendSteps = `
## Getting Started

### 1. Setup the Backend First
Before using the frontend SDK, you must have the KavachID core backend running. 
Follow the [KavachID Backend Setup Guide](https://github.com/Rajeev02/kavachid/blob/main/README.md) to start the backend server.

### 2. Configure the SDK
Once your backend is running (e.g., at \`http://localhost:3000\`), initialize the SDK:

\`\`\`typescript
import { KavachID } from '@kavachid/sdk'; // or equivalent for your platform

const kavach = new KavachID({
  apiUrl: 'http://localhost:3000',
  tenantId: 'your-tenant-id' // Optional: for multi-tenant setups
});
\`\`\`

### 3. Implement Authentication
Use the provided hooks, components, or raw SDK methods to authenticate users.
`;

const backendSteps = `
## Getting Started

### 1. Setup the Core Infrastructure
Before using this middleware/library, ensure your primary PostgreSQL database and Redis (if using caching/throttling) are running.

### 2. Install and Import
Install the library via npm, yarn, or pnpm. Then import it into your NestJS, Express, or other Node.js application.

### 3. Configure Middleware/Guards
Apply the provided middleware to protect your routes.

\`\`\`typescript
// Example usage:
import { KavachMiddleware } from '@kavachid/express';

app.use('/protected', KavachMiddleware({
  jwksUri: 'http://localhost:3000/.well-known/jwks.json',
  audience: 'your-api-audience',
  issuer: 'http://localhost:3000'
}));
\`\`\`
`;

const map = {
  'kavach-react/README.md': frontendSteps,
  'kavach-react-native/README.md': frontendSteps,
  'kavach-sdk/README.md': frontendSteps,
  'kavach-express/README.md': backendSteps
};

for (const [file, steps] of Object.entries(map)) {
  if (fs.existsSync(file)) {
    let data = fs.readFileSync(file, 'utf8');
    if (!data.includes('## Getting Started')) {
      data += '\n' + steps;
      fs.writeFileSync(file, data);
    }
  }
}
