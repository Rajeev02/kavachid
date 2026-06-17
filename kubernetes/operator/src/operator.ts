import * as k8s from '@kubernetes/client-node';
import { Client } from 'pg';
import { randomUUID } from 'crypto';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const k8sCustomApi = kc.makeApiClient(k8s.CustomObjectsApi);

const dbUrl = process.env.DATABASE_URL || 'postgresql://kavach:supersecretpassword@localhost:5432/kavachid?schema=public';
const appUrl = process.env.KAVACHID_APP_URL || 'http://localhost:3000';

interface KavachTenantSpec {
  name: string;
  adminEmail: string;
  adminPassword?: string;
}

interface KavachTenant {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace: string;
    uid?: string;
    resourceVersion?: string;
  };
  spec: KavachTenantSpec;
  status?: {
    phase?: string;
    message?: string;
    tenantId?: string;
    createdAt?: string;
  };
}

async function reconcile(obj: any) {
  const tenant = obj as KavachTenant;
  const name = tenant.spec.name;
  const adminEmail = tenant.spec.adminEmail;
  const adminPassword = tenant.spec.adminPassword || 'TemporaryPassword123!';
  const namespace = tenant.metadata.namespace;
  const resourceName = tenant.metadata.name;

  if (tenant.status?.phase === 'Active') {
    // Tenant is already provisioned and active
    return;
  }

  console.log(`[Reconciler] Provisioning tenant: ${name} (Resource: ${resourceName})`);

  const client = new Client({ connectionString: dbUrl });
  try {
    await client.connect();

    // 1. Generate unique tenant ID using built-in crypto module
    const tenantId = randomUUID();

    // 2. Insert tenant row into the postgres database
    await client.query(
      `INSERT INTO tenants (id, name, status, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW())`,
      [tenantId, name, 'active']
    );
    console.log(`[Reconciler] Tenant database row created with ID: ${tenantId}`);

    // 3. Register the Admin user under the new tenant context
    const response = await fetch(`${appUrl}/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({
        email: adminEmail,
        password: adminPassword,
        username: 'admin',
        metadata: {
          role: 'Admin',
          provisionedBy: 'KavachKubernetesOperator'
        }
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`KavachID Admin user registration failed: ${errBody}`);
    }
    console.log(`[Reconciler] Admin user registered successfully for tenant: ${tenantId}`);

    // 4. Update the Custom Resource Status inside Kubernetes
    await updateStatus(resourceName, namespace, 'Active', 'Tenant provisioned successfully', tenantId);

  } catch (err: any) {
    console.error(`[Reconciler] Error provisioning tenant ${name}:`, err.message);
    await updateStatus(resourceName, namespace, 'Failed', err.message);
  } finally {
    await client.end();
  }
}

async function updateStatus(name: string, namespace: string, phase: string, message: string, tenantId?: string) {
  try {
    const statusObj = {
      phase,
      message,
      tenantId,
      createdAt: new Date().toISOString()
    };

    // Patch Custom Object Status
    await k8sCustomApi.patchNamespacedCustomObjectStatus(
      'kavachid.local',
      'v1',
      namespace,
      'kavachtenants',
      name,
      { status: statusObj },
      undefined,
      undefined,
      undefined,
      { headers: { 'Content-Type': 'application/merge-patch+json' } }
    );
    console.log(`[Status] Updated tenant status to: ${phase}`);
  } catch (err: any) {
    console.error(`[Status] Failed to update Kubernetes status:`, err.message);
  }
}

async function watchTenants() {
  const watch = new k8s.Watch(kc);
  const path = '/apis/kavachid.local/v1/kavachtenants';
  
  console.log(`[Operator] Watching KavachTenant custom resources on: ${path}`);
  
  const watchHandler = async (type: string, obj: any) => {
    if (type === 'ADDED' || type === 'MODIFIED') {
      await reconcile(obj);
    } else if (type === 'DELETED') {
      console.log(`[Operator] Tenant resource deleted: ${obj.metadata.name}`);
    }
  };

  const errorHandler = (err: any) => {
    console.error(`[Operator] Watch error encountered:`, err);
    setTimeout(watchTenants, 5000); // Re-establish watch
  };

  try {
    await watch.watch(path, {}, watchHandler, errorHandler);
  } catch (err: any) {
    console.error(`[Operator] Failed to start watcher:`, err.message);
    setTimeout(watchTenants, 5000);
  }
}

watchTenants();
