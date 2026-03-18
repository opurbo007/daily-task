import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const cardSchema = z.object({
  title:   z.string().min(1, "Title is required").max(100),
  type:    z.enum(["BOOKMARK", "NOTE", "CODE", "OTHER"]).default("NOTE"),
  content: z.string().max(10000).optional().nullable(),
  url:     z.string().url("Must be a valid URL").optional().nullable().or(z.literal("")),
  color:   z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#6366f1"),
  pinned:  z.boolean().default(false),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cards = await prisma.spaceCard.findMany({
    where: { userId: session.user.id },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(cards);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = cardSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  const card = await prisma.spaceCard.create({
    data: { ...parsed.data, url: parsed.data.url || null, userId: session.user.id },
  });

  return NextResponse.json(card, { status: 201 });
}