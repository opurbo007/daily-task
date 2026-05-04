import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";

const schema = z.object({
  email: z.string().email(),
  token: z.string().min(20),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const identifier = `password-reset:${email}`;
  const token = hashToken(parsed.data.token);

  const resetToken = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!resetToken || resetToken.identifier !== identifier || resetToken.expires < new Date()) {
    return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(parsed.data.password, 12);

  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
  });

  await prisma.verificationToken.deleteMany({ where: { identifier } });

  return NextResponse.json({ success: true });
}
