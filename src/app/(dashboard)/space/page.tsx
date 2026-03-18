import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import PersonalSpaceClient from "@/components/space/PersonalSpaceClient";

export const metadata: Metadata = { title: "Personal Space" };

export default async function PersonalSpacePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const cards = await prisma.spaceCard.findMany({
    where: { userId: session.user.id },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  });

  return <PersonalSpaceClient initialCards={cards as any} />;
}
