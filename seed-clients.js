require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Get the first tenant
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    console.log('No tenant found. Please run seed-admin.js first.');
    return;
  }

  const clients = [
    { name: 'Kavach Admin', description: 'Administrative Console' },
    { name: 'Kavach Store', description: 'E-commerce Demo' },
    { name: 'Kavach Customer', description: 'Customer Support Portal' },
    { name: 'Kavach Vendor', description: 'Vendor Portal' },
    { name: 'Kavach Analytics', description: 'Analytics Dashboard' }
  ];

  for (const client of clients) {
    // Check if exists
    const existing = await prisma.appClient.findFirst({
      where: { tenantId: tenant.id, name: client.name }
    });

    if (!existing) {
      await prisma.appClient.create({
        data: {
          tenantId: tenant.id,
          name: client.name,
          description: client.description
        }
      });
      console.log(`Created AppClient: ${client.name}`);
    } else {
      console.log(`AppClient already exists: ${client.name}`);
    }
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
