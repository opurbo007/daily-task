import { Metadata } from "next";
import { redirect } from "next/navigation";
import { subMonths } from "date-fns";
import { auth } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import FitnessClient from "../../../components/fitness/FitnessClient";

export const metadata: Metadata = { title: "Fitness" };
export const dynamic = "force-dynamic";

export default async function FitnessPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const fitnessTag = await prisma.tag.upsert({
    where: { userId_name: { userId, name: "Fitness" } },
    update: {},
    create: { userId, name: "Fitness", color: "#10b981" },
  });

  const tasks = await prisma.task.findMany({
    where: {
      userId,
      tags: { some: { tagId: fitnessTag.id } },
      OR: [{ dueDate: { gte: subMonths(new Date(), 1) } }, { dueDate: null }],
    },
    include: { tags: { include: { tag: true } } },
    orderBy: [{ dueDate: "desc" }, { createdAt: "desc" }],
  });

  return <FitnessClient tasks={tasks as any} fitnessTag={fitnessTag} />;
}
