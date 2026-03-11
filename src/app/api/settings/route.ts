import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { notificationSettings, theme } = body;

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(notificationSettings && { notificationSettings }),
      ...(theme && { theme }),
    },
    select: { id: true, notificationSettings: true, theme: true },
  });

  return NextResponse.json(user);
}
