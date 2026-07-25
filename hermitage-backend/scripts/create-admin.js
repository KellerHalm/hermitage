import 'dotenv/config';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import readline from 'node:readline';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function generatePassword(length = 16) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  const bytes = crypto.randomBytes(length);
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars[bytes[i] % chars.length];
  }
  return password;
}

function askQuestion(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  let email = args.find((a) => a.startsWith('--email='))?.split('=')[1];

  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (existingAdmin) {
    console.log(`Admin already exists: ${existingAdmin.email}`);
    console.log('To create another admin, do it from the admin panel.');
    return;
  }

  if (!email) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    email = await askQuestion(rl, 'Admin email: ');
    rl.close();

    if (!email || !email.includes('@')) {
      console.error('Invalid email address.');
      process.exit(1);
    }
  }

  const password = generatePassword();
  const hashedPassword = await bcrypt.hash(password, 12);

  const created = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'Hermitage',
      phone: '',
      role: 'ADMIN',
    },
  });

  const verifyUser = await prisma.user.findUnique({ where: { id: created.id } });
  const passwordValid = await bcrypt.compare(password, verifyUser.password);

  if (!passwordValid) {
    console.error('FATAL: Password verification failed after creation!');
    process.exit(1);
  }

  console.log('');
  console.log('========================================');
  console.log('  Admin account created successfully!');
  console.log('========================================');
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
  console.log('========================================');
  console.log('  Save this password! It will not be shown again.');
  console.log('========================================');
}

main()
  .catch((error) => {
    console.error('Failed to create admin:', error.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
