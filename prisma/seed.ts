import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs'; // <-- Use bcryptjs instead of bcrypt

// Initialize Prisma Client
const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // --- CREATE YOUR ADMIN USER ---
  // You can change the password here to a secure password of your choice.
  const password = 'Alpha3302!'; 
  // Use bcryptjs for hashing
  const hashedPassword = await bcrypt.hash(password, 12);

  const adminUser = await prisma.user.upsert({
    // Find the user by their unique username
    where: { username: 'admin' },
    // If the user already exists, do nothing to it
    update: {},
    // If the user does not exist, create them with these details
    create: {
      username: 'admin',
      fullName: 'Admin User',
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  console.log(`Created admin user: ${adminUser.username}`);
  console.log(`Seeding finished.`);
}

// Execute the main function and handle potential errors
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // Ensure the Prisma Client is disconnected after the script runs
    await prisma.$disconnect();
  });
