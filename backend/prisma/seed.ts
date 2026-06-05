import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email    = process.env.SEED_ADMIN_EMAIL    ?? 'admin@example.com';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'Admin@12345';
  const name     = process.env.SEED_ADMIN_NAME     ?? 'Administrator';

  console.log('🌱 Seeding database...');

  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name,
      email,
      password: hashedPassword,
      role: 'Admin',
      status: 'Active',
      workplace: 'Headquarters',
      department: 'Administration',
    },
  });

  console.log('✅ Admin user created:', admin.email);
  console.log('\n📋 Login credentials:');
  console.log('   Email   :', email);
  console.log('   Password:', password);
  console.log('\n🎉 Seeding complete!\n');
}

main()
  .catch(e => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
