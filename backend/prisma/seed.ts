import { PrismaClient, TaskStatus, TaskPriority } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  await prisma.refreshToken.deleteMany();
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('password123', 10);
  const user = await prisma.user.create({
    data: { name: 'Demo User', email: 'demo@example.com', password: hashedPassword },
  });

  console.log(`✅ Created demo user: ${user.email} (password: password123)`);

  await prisma.task.createMany({
    data: [
      { title: 'Set up project repository', description: 'Initialize Git, add .gitignore, push to GitHub', status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, userId: user.id, dueDate: new Date('2024-01-10') },
      { title: 'Design database schema', description: 'Define User, Task, RefreshToken models in Prisma', status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, userId: user.id, dueDate: new Date('2024-01-12') },
      { title: 'Build authentication API', description: 'Register, login, refresh token, logout endpoints with JWT', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, userId: user.id, dueDate: new Date('2024-01-20') },
      { title: 'Build task CRUD endpoints', description: 'Create, read, update, delete with pagination and filtering', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.MEDIUM, userId: user.id, dueDate: new Date('2024-01-22') },
      { title: 'Build Next.js frontend', description: 'Login, register pages and task dashboard with Tailwind CSS', status: TaskStatus.PENDING, priority: TaskPriority.HIGH, userId: user.id, dueDate: new Date('2024-01-28') },
      { title: 'Add rate limiting and security headers', description: 'Install helmet and express-rate-limit packages', status: TaskStatus.PENDING, priority: TaskPriority.MEDIUM, userId: user.id },
      { title: 'Write unit tests', description: 'Test auth and task controllers with Jest', status: TaskStatus.PENDING, priority: TaskPriority.LOW, userId: user.id, dueDate: new Date('2024-02-01') },
      { title: 'Deploy to production', description: 'Deploy backend to Railway, frontend to Vercel', status: TaskStatus.PENDING, priority: TaskPriority.LOW, userId: user.id, dueDate: new Date('2024-02-05') },
    ],
  });

  console.log('✅ Created 8 sample tasks with priorities');
  console.log('\n🎉 Seeding complete! Login: demo@example.com / password123');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
