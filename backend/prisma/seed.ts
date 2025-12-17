import { PrismaClient, LoginType, UserType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Create Super Admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const superAdmin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      longName: 'System Administrator',
      email: 'admin@example.com',
      loginType: LoginType.EMAIL_PASSWORD,
      passwordHash: hashedPassword,
      userType: UserType.SUPER_ADMIN,
      isActive: true,
    },
  });

  console.log(`✅ Created Super Admin user: ${superAdmin.username}`);

  // Create default ProjectTypes
  const projectTypes = [
    {
      name: 'Software Development',
      description: 'Projects for software development and engineering',
      defaultSettings: {
        requireApproval: true,
        enableVersioning: true,
      },
    },
    {
      name: 'Hardware Development',
      description: 'Projects for hardware and embedded systems',
      defaultSettings: {
        requireApproval: true,
        enableVersioning: true,
      },
    },
    {
      name: 'Research & Development',
      description: 'R&D and innovation projects',
      defaultSettings: {
        requireApproval: false,
        enableVersioning: true,
      },
    },
    {
      name: 'Compliance & Standards',
      description: 'Projects for compliance and regulatory requirements',
      defaultSettings: {
        requireApproval: true,
        enableVersioning: true,
      },
    },
  ];

  for (const typeData of projectTypes) {
    const projectType = await prisma.projectType.upsert({
      where: { name: typeData.name },
      update: {},
      create: typeData,
    });

    console.log(`✅ Created ProjectType: ${projectType.name}`);
  }

  console.log('✅ Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
