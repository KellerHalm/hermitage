import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.compare.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.productCharacteristic.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.country.deleteMany();
  await prisma.user.deleteMany();

  const adminPassword = await bcrypt.hash('Admin123!', 12);
  await prisma.user.create({
    data: {
      email: 'admin@hermitage-decor.ru',
      password: adminPassword,
      firstName: 'Админ',
      lastName: 'HERMITAGE',
      phone: '+7 (900) 123-45-67',
      role: 'ADMIN',
    },
  });

  const managerPassword = await bcrypt.hash('Manager123!', 12);
  await prisma.user.create({
    data: {
      email: 'manager@hermitage-decor.ru',
      password: managerPassword,
      firstName: 'Менеджер',
      lastName: 'HERMITAGE',
      phone: '+7 (900) 123-45-68',
      role: 'MANAGER',
    },
  });

  console.log('Seed completed successfully');
  console.log('Admin: admin@hermitage-decor.ru / Admin123!');
  console.log('Manager: manager@hermitage-decor.ru / Manager123!');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
