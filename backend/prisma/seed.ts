import { PrismaClient, RoleName } from '@prisma/client';

const prisma = new PrismaClient();

const roles: Array<{ name: RoleName; description: string }> = [
  { name: RoleName.ADMIN, description: 'Full platform administrator' },
  { name: RoleName.TEACHER, description: 'Instructor account' },
  { name: RoleName.STUDENT, description: 'Learner account' },
  { name: RoleName.SUPPORT, description: 'Support team account' },
];

const permissions = [
  'users.read',
  'users.create',
  'users.update',
  'users.delete',
  'wallets.read',
  'wallets.update',
  'roles.read',
  'roles.manage',
  'permissions.read',
  'permissions.manage',
  'auth.me',
  'admin.panel.access',
  'teacher.panel.access',
  'student.panel.access',
  'support.panel.access',
];

const rolePermissions: Record<RoleName, string[]> = {
  [RoleName.ADMIN]: permissions,
  [RoleName.TEACHER]: ['teacher.panel.access', 'student.panel.access', 'users.read'],
  [RoleName.STUDENT]: ['student.panel.access', 'auth.me'],
  [RoleName.SUPPORT]: ['support.panel.access', 'users.read', 'wallets.read'],
};

async function main() {
  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: role,
    });
  }

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { name: permission },
      update: {},
      create: { name: permission },
    });
  }

  for (const [roleName, permissionNames] of Object.entries(rolePermissions) as Array<[RoleName, string[]]>) {
    const role = await prisma.role.findUniqueOrThrow({ where: { name: roleName } });
    const assignedPermissions = await prisma.permission.findMany({
      where: { name: { in: permissionNames } },
    });

    for (const permission of assignedPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
