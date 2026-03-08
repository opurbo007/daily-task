import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Demo user
  const password = await bcrypt.hash("demo1234", 12);
  const user = await prisma.user.upsert({
    where: { email: "demo@taskmaster.app" },
    update: {},
    create: {
      name: "Demo User",
      email: "demo@taskmaster.app",
      password,
    },
  });

  console.log(`✅ Created user: ${user.email}`);

  // Tags
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { userId_name: { userId: user.id, name: "Work" } },
      update: {},
      create: { name: "Work", color: "#3b82f6", userId: user.id },
    }),
    prisma.tag.upsert({
      where: { userId_name: { userId: user.id, name: "Personal" } },
      update: {},
      create: { name: "Personal", color: "#22c55e", userId: user.id },
    }),
    prisma.tag.upsert({
      where: { userId_name: { userId: user.id, name: "Urgent" } },
      update: {},
      create: { name: "Urgent", color: "#ef4444", userId: user.id },
    }),
    prisma.tag.upsert({
      where: { userId_name: { userId: user.id, name: "Learning" } },
      update: {},
      create: { name: "Learning", color: "#8b5cf6", userId: user.id },
    }),
  ]);

  console.log(`✅ Created ${tags.length} tags`);

  // Sample tasks
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        title: "Complete API Integration",
        description: "Finish integrating the payment gateway API with proper error handling",
        priority: "CRITICAL",
        status: "IN_PROGRESS",
        dueDate: new Date(),
        estimatedTime: 120,
        userId: user.id,
        sortOrder: 0,
        tags: { create: [{ tagId: tags[0].id }, { tagId: tags[2].id }] },
      },
    }),
    prisma.task.create({
      data: {
        title: "Fix driver assignment bug",
        description: "Investigate and fix the race condition in driver assignment logic",
        priority: "HIGH",
        status: "PENDING",
        dueDate: new Date(),
        estimatedTime: 60,
        userId: user.id,
        sortOrder: 1,
        tags: { create: [{ tagId: tags[0].id }] },
      },
    }),
    prisma.task.create({
      data: {
        title: "Update dashboard UI",
        description: "Implement the new design mockups for the admin dashboard",
        priority: "MEDIUM",
        status: "PENDING",
        dueDate: tomorrow,
        estimatedTime: 90,
        userId: user.id,
        sortOrder: 2,
        tags: { create: [{ tagId: tags[0].id }] },
      },
    }),
    prisma.task.create({
      data: {
        title: "Team weekly sync",
        description: "Prepare agenda and status updates for the team meeting",
        priority: "MEDIUM",
        status: "PENDING",
        dueDate: tomorrow,
        estimatedTime: 30,
        userId: user.id,
        sortOrder: 3,
        tags: { create: [{ tagId: tags[0].id }] },
      },
    }),
    prisma.task.create({
      data: {
        title: "Read Next.js documentation",
        description: "Study the new App Router features and server components",
        priority: "LOW",
        status: "PENDING",
        estimatedTime: 45,
        userId: user.id,
        sortOrder: 4,
        tags: { create: [{ tagId: tags[3].id }] },
      },
    }),
  ]);

  console.log(`✅ Created ${tasks.length} tasks`);

  // Welcome notification
  await prisma.notification.create({
    data: {
      userId: user.id,
      title: "Welcome to TaskMaster! 🎉",
      message:
        "Demo account ready. Explore the dashboard, create tasks, and set up Telegram notifications!",
      type: "SYSTEM",
    },
  });

  console.log("✅ Seeding complete!");
  console.log(`\n📧 Demo login: demo@taskmaster.app`);
  console.log(`🔑 Demo password: demo1234`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
