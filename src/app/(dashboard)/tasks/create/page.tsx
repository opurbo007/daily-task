import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import TaskForm from "@/components/tasks/TaskForm";

export const metadata: Metadata = { title: "Create Task" };

export default async function CreateTaskPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const tags = await prisma.tag.findMany({
    where: { userId: session.user.id },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold">Create New Task</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Add a new task to your productivity system
        </p>
      </div>
      <TaskForm tags={tags} mode="create" />
    </div>
  );
}
