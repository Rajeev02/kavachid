const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenantId = '123e4567-e89b-12d3-a456-426614174000';
  const userId = 'd73d3af9-baf7-4266-a1c7-e60445638e11';

  try {
    // Check if role exists
    let role = await prisma.role.findUnique({
      where: { tenantId_name: { tenantId, name: 'admin' } }
    });

    if (!role) {
      role = await prisma.role.create({
        data: {
          tenantId,
          name: 'admin',
          description: 'System Administrator',
          isSystem: true
        }
      });
    }

    // Assign users:read permission
    let perm = await prisma.permission.findUnique({
      where: { tenantId_resource_action: { tenantId, resource: 'users', action: 'read' } }
    });

    if (!perm) {
      perm = await prisma.permission.create({
        data: { tenantId, resource: 'users', action: 'read' }
      });
    }

    // Attach permission to role
    await prisma.rolePermission.upsert({
      where: { tenantId_roleId_permissionId: { tenantId, roleId: role.id, permissionId: perm.id } },
      create: { tenantId, roleId: role.id, permissionId: perm.id },
      update: {}
    });

    // Attach role to user
    await prisma.userRole.upsert({
      where: { tenantId_userId_roleId: { tenantId, userId, roleId: role.id } },
      create: { tenantId, userId, roleId: role.id },
      update: {}
    });

    console.log('Successfully assigned admin role to user');
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
