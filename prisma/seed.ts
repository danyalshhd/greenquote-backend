import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Admin123!', 10);

  const existing = await prisma.user.findUnique({
    where: { email: 'admin@test.com' },
  });
  if (!existing) {
    await prisma.user.create({
      data: {
        fullName: 'Admin User',
        email: 'admin@test.com',
        password: hash,
        isAdmin: true,
      },
    });
    console.log('Seeded admin user: admin@test.com / Admin123!');
  } else {
    console.log('Admin user already exists.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
