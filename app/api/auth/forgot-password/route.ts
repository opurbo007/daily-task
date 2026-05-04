import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { addHours } from "date-fns";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { sendMail } from "../../../../lib/mail";

const schema = z.object({
  email: z.string().email(),
});

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  if (user?.password) {
    const rawToken = randomBytes(32).toString("hex");
    const token = hashToken(rawToken);
    const identifier = `password-reset:${email}`;
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || ""}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

    await prisma.verificationToken.deleteMany({ where: { identifier } });
    await prisma.verificationToken.create({
      data: {
        identifier,
        token,
        expires: addHours(new Date(), 1),
      },
    });

    await sendMail({
      to: email,
      subject: "Reset your TaskMaster password",
      text: `You requested a TaskMaster password reset.\n\nReset your password using this link:\n${resetUrl}\n\nThis link expires in 1 hour. If you did not request this, ignore this email.`,
      html: `
        <div style="background:#f6f8fb;padding:28px 16px;font-family:Arial,sans-serif;color:#111827">
          <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;padding:28px">
            <h1 style="font-size:22px;margin:0 0 12px">Reset your TaskMaster password</h1>
            <p style="font-size:14px;line-height:1.6;margin:0 0 18px">You requested a password reset. This secure link expires in 1 hour.</p>
            <p style="margin:0 0 22px">
              <a href="${resetUrl}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;border-radius:10px;padding:12px 18px;font-size:14px;font-weight:700">Reset password</a>
            </p>
            <p style="font-size:12px;line-height:1.6;color:#6b7280;margin:0">If you did not request this, ignore this email. For security, do not forward this message.</p>
          </div>
        </div>
      `,
    });
  }

  return NextResponse.json({ success: true });
}
