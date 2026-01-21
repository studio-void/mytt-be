import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

async function main() {
  const prisma = new PrismaClient();

  const adminPassword = await bcrypt.hash('admin1234', 10);
  const userPassword = await bcrypt.hash('user1234', 10);

  await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: '관리자',
      password: adminPassword,
      isAdmin: true,
    },
  });

  await prisma.user.create({
    data: {
      email: 'user@example.com',
      name: '일반유저',
      password: userPassword,
      isAdmin: false,
    },
  });

  console.log('Seeding Done');
  await prisma.$disconnect();
}

main().catch(console.error);
