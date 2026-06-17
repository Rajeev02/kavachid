require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminClient = await prisma.appClient.findFirst({
    where: { name: 'Kavach Admin' }
  });

  if (adminClient) {
    let appJs = fs.readFileSync('examples/kavach-admin/app.js', 'utf8');
    appJs = appJs.replace(
      /new KavachAuthHelper\({/,
      `new KavachAuthHelper({\n  clientId: '${adminClient.id}',`
    );
    fs.writeFileSync('examples/kavach-admin/app.js', appJs);
    console.log('Patched examples/kavach-admin/app.js with clientId: ' + adminClient.id);
  } else {
    console.log('Admin Client not found');
  }

  const storeClient = await prisma.appClient.findFirst({
    where: { name: 'Kavach Store' }
  });

  if (storeClient) {
    let appJs = fs.readFileSync('examples/kavach-store/app.js', 'utf8');
    appJs = appJs.replace(
      /new KavachAuthHelper\({/,
      `new KavachAuthHelper({\n  clientId: '${storeClient.id}',`
    );
    fs.writeFileSync('examples/kavach-store/app.js', appJs);
    console.log('Patched examples/kavach-store/app.js with clientId: ' + storeClient.id);
  }
}

main().finally(() => process.exit(0));
