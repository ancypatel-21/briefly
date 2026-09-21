import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSessionToken, hashPassword, setSessionCookie } from "@/lib/auth";
import { slugify } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(200),
  teamName: z.string().min(1).max(100).optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { name, email, password, teamName } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const resolvedTeamName = teamName || `${name}'s Team`;
  let slug = slugify(resolvedTeamName) || "team";

  const user = await prisma.$transaction(async (tx) => {
    const slugTaken = await tx.team.findUnique({ where: { slug } });
    if (slugTaken) {
      slug = `${slug}-${Math.random().toString(36).slice(2, 7)}`;
    }

    const createdUser = await tx.user.create({
      data: { name, email, passwordHash },
    });

    const team = await tx.team.create({
      data: { name: resolvedTeamName, slug },
    });

    await tx.teamMember.create({
      data: { teamId: team.id, userId: createdUser.id, role: "OWNER" },
    });

    return createdUser;
  });

  const token = await createSessionToken({ userId: user.id });
  await setSessionCookie(token);

  return NextResponse.json({ id: user.id, name: user.name, email: user.email });
}
