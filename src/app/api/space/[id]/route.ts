import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  title:   z.string().min(1).max(100).optional(),
  type:    z.enum(["BOOKMARK", "NOTE", "CODE", "OTHER"]).optional(),
  content: z.string().max(10000).optional().nullable(),
  url:     z.string().url().optional().nullable().or(z.literal("")),
  color:   z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  pinned:  z.boolean().optional(),
});

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.spaceCard.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  const card = await prisma.spaceCard.update({
    where: { id },
    data: { ...parsed.data, url: parsed.data.url || null },
  });

  return NextResponse.json(card);
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.spaceCard.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.spaceCard.delete({ where: { id } });
  return NextResponse.json({ success: true });
}