import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import LifeGoalsClient from "../../../components/goals/LifeGoalsClient";

export const metadata: Metadata = { title: "Life Goals" };
export const dynamic = "force-dynamic";

export default async function LifeGoalsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const goalTag = await prisma.tag.upsert({
    where: { userId_name: { userId, name: "Life Goal" } },
    update: {},
    create: { userId, name: "Life Goal", color: "#38bdf8" },
  });

  const goals = await prisma.task.findMany({
    where: { userId, tags: { some: { tagId: goalTag.id } } },
    include: { tags: { include: { tag: true } } },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
  });

  return <LifeGoalsClient goals={goals as any} goalTag={goalTag} />;
}
